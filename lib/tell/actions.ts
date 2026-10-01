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
import { countUsed, dailyLimit, localDayWindow } from "@/lib/scans/quota";
import { isTellConfigured } from "./config";
import { runTell } from "./extract";
import { tellFailureMessage, tellMessages, type TellFailure } from "./messages";
import { isUsable, normalizeTell, type TellRoster } from "./normalize";
import type { TellAnswers, TellResult } from "./result";
import { TELL_ROSTER_NAME_MAX } from "./rules";
import { answerTellSchema, draftBillSchema, tellRefSchema } from "./schema";
import { maybeSweepTell } from "./sweep";

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

  const plan = await db.person.findUniqueOrThrow({ where: { id: person.id }, select: { plan: true } });
  const limit = dailyLimit(plan.plan);
  const window = localDayWindow(timeZone);
  const draft = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${person.id}))`;
    const used = await countUsed(tx, person.id, window);
    if (used >= limit) return null;
    return tx.tellDraft.create({
      data: { personId: person.id, groupId, text, timeZone, status: "DRAFTING", startedAt: new Date() },
      select: { id: true },
    });
  });
  if (!draft) return actionFail("conflict", scanMessages.quota(limit));
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
    console.error("[tell] drafting failed", error);
    return { ok: false as const, failure: "failed" as const };
  });
  if (!outcome.ok) {
    await markFailed(draft.id, outcome.failure);
    return actionFail(outcome.failure === "vague" ? "invalid" : "unknown", tellFailureMessage(outcome.failure));
  }

  const usage = { model: outcome.model, inputTokens: outcome.usage.inputTokens, outputTokens: outcome.usage.outputTokens };
  const result = normalizeTell(outcome.extraction, roster, composer.currency);
  if (!isUsable(outcome.extraction, result)) {
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
  const saved = await db.tellDraft.updateMany({
    where: { id: draftId, personId: person.id, status: "SUCCEEDED" },
    data: { answers: toJson(answers) },
  });
  if (saved.count === 0) return actionFail("notFound", tellMessages.gone);
  return actionOk(null);
});

export const discardTell = defineAction(tellRefSchema, async ({ draftId }, { person }) => {
  await db.tellDraft.updateMany({
    where: { id: draftId, personId: person.id, status: "SUCCEEDED" },
    data: { status: "DISCARDED", completedAt: new Date(), text: null },
  });
  return actionOk(null);
});
