"use server";

import { defineAction } from "@/lib/actions/action";
import { actionFail, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { minorUnitsOf } from "@/lib/currency";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { groupMessages } from "@/lib/groups/messages";
import { getBillComposer } from "@/lib/groups/queries";
import { normalizeName } from "@/lib/members/names";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { scanMessages } from "@/lib/scans/messages";
import { countTellAttempts, countUsed, dailyLimit, localDayWindow } from "@/lib/scans/quota";
import { isTellConfigured } from "./config";
import { runTell } from "./extract";
import { tellFailureMessage, tellMessages, type TellFailure } from "./messages";
import { hasSubstance } from "./guard";
import { normalizeTell, type TellRoster } from "./normalize";
import { parseTellResult, type TellAnswers, type TellResult } from "./result";
import { TELL_FREE_MISSES, TELL_ROSTER_NAME_MAX } from "./rules";
import { answerTellSchema, draftBillSchema, tellRefSchema } from "./schema";
import { maybeSweepTell } from "./sweep";
import { breakerCooldown, personCooldown } from "./throttle";

const toJson = (value: TellResult | TellAnswers): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export interface TellDrafted {
  readonly draftId: string;
  readonly result: TellResult;
}

function localDay(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

async function markFailed(draftId: string, failure: TellFailure, usage?: { model: string; inputTokens: number | null; outputTokens: number | null }): Promise<void> {
  await db.tellDraft.update({
    where: { id: draftId },
    data: { status: "FAILED", failure, completedAt: new Date(), ...usage },
  });
}

export const draftBill = defineAction(draftBillSchema, async ({ groupId, text, timeZone }, { person }) => {
  if (!isTellConfigured()) return actionFail("conflict", tellMessages.unavailable);
  const composer = await getBillComposer(groupId, person.id);
  if (!composer) return actionFail("forbidden", groupMessages.notMember);
  const verdict = await consumeRate("tellStart", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, tellMessages.rateLimited);

  if (!hasSubstance(text)) return actionFail("invalid", tellFailureMessage("vague"));
  const cooling = (await personCooldown(person.id)) ?? (await breakerCooldown());
  if (cooling !== null) return actionRateLimited(cooling, tellMessages.cooling(cooling));

  const plan = await db.person.findUniqueOrThrow({ where: { id: person.id }, select: { plan: true } });
  const limit = dailyLimit(plan.plan);
  const window = localDayWindow(timeZone);
  const reserved = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${person.id}))`;
    if ((await countUsed(tx, person.id, window)) >= limit) return { ok: false as const, reason: "quota" as const };
    if ((await countTellAttempts(tx, person.id, window)) >= limit + TELL_FREE_MISSES) return { ok: false as const, reason: "tries" as const };
    const created = await tx.tellDraft.create({
      data: { personId: person.id, groupId, text, timeZone, status: "DRAFTING", startedAt: new Date() },
      select: { id: true },
    });
    return { ok: true as const, id: created.id };
  });
  if (!reserved.ok) return actionFail("conflict", reserved.reason === "quota" ? scanMessages.quota(limit) : tellMessages.tooManyTries);
  const draft = { id: reserved.id };
  maybeSweepTell();

  const roster: TellRoster = {
    members: composer.members.map((m) => ({ id: m.id, name: m.displayName })),
    speaker: Math.max(0, composer.members.findIndex((m) => m.id === person.id)),
  };
  const outcome = await runTell(text, {
    roster: roster.members.map((m) => normalizeName(m.name).slice(0, TELL_ROSTER_NAME_MAX)),
    speaker: roster.speaker,
    currency: composer.currency,
    minorUnits: minorUnitsOf(composer.currency),
    today: localDay(timeZone),
  }).catch((error: unknown) => {
    console.error("[tell] drafting failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown error");
    return { ok: false as const, failure: "failed" as const };
  });
  if (!outcome.ok) {
    await markFailed(draft.id, outcome.failure);
    if (outcome.failure === "vague") return actionFail("invalid", tellFailureMessage(outcome.failure));
    return actionFail("unknown", (await breakerCooldown()) === null ? tellFailureMessage(outcome.failure) : tellMessages.busy);
  }

  const usage = { model: outcome.model, inputTokens: outcome.usage.inputTokens, outputTokens: outcome.usage.outputTokens };
  const normalized = (() => {
    try {
      return normalizeTell(outcome.extraction, { text, roster, currency: composer.currency, minorUnits: minorUnitsOf(composer.currency) });
    } catch (error) {
      console.error("[tell] normalizing failed", error instanceof Error ? error.message : "unknown error");
      return null;
    }
  })();
  if (!normalized) {
    await markFailed(draft.id, "vague", usage);
    return actionFail("invalid", tellFailureMessage("vague"));
  }
  const { result, usable } = normalized;
  if (!usable) {
    const failure: TellFailure = outcome.extraction.problem === "notBill" ? "notBill" : "vague";
    await markFailed(draft.id, failure, usage);
    return actionFail("invalid", tellFailureMessage(failure));
  }

  await db.tellDraft.update({
    where: { id: draft.id },
    data: { status: "SUCCEEDED", result: toJson(result), completedAt: new Date(), ...usage },
  });
  return actionOk<TellDrafted>({ draftId: draft.id, result });
});

export const answerTell = defineAction(answerTellSchema, async ({ draftId, answers }, { person }) => {
  const row = await db.tellDraft.findFirst({
    where: { id: draftId, personId: person.id, status: "SUCCEEDED" },
    select: { id: true, result: true },
  });
  const result = row ? parseTellResult(row.result) : null;
  if (!row || !result) return actionFail("notFound", tellMessages.gone);
  const asked = new Set(result.questions.flatMap((question) => (question.kind === "who" ? [String(question.person)] : [])));
  const kept: TellAnswers = {
    people: Object.fromEntries(Object.entries(answers.people).filter(([index]) => asked.has(index))),
    amount: result.questions.some((question) => question.kind === "amount") ? answers.amount : null,
    payerId: result.payer === null ? answers.payerId : null,
  };
  await db.tellDraft.update({ where: { id: row.id }, data: { answers: toJson(kept) } });
  return actionOk(null);
});

export const discardTell = defineAction(tellRefSchema, async ({ draftId }, { person }) => {
  await db.tellDraft.updateMany({
    where: { id: draftId, personId: person.id, status: "SUCCEEDED" },
    data: { status: "DISCARDED", completedAt: new Date(), text: null },
  });
  return actionOk(null);
});
