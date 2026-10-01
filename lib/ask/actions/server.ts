"use server";

import { defineAction } from "@/lib/actions/action";
import { actionFail, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { countUsed, dailyLimit, getAllowance, localDayWindow, lockAssists } from "@/lib/ai/allowance";
import { db } from "@/lib/db";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { undoSettlement } from "@/lib/settlements/actions";
import type { AskReply } from "../result";
import { applyPick, buildAction } from "./build";
import type { AskActResult } from "./card";
import { executeAction } from "./execute";
import { EMPTY_INTENT, parseIntent } from "./intent";
import { ACTION_TTL_MS } from "./kinds";
import { askActionMessages } from "./messages";
import { buildEnv, settleBuilt } from "./resolve";
import { actionRefSchema, confirmActionSchema, proposeActionSchema } from "./schema";
import { toJson } from "./store";

type Claim = { readonly state: "missing" } | { readonly state: "limit" } | { readonly state: "claimed"; readonly intent: unknown; readonly fingerprint: string; readonly expiresAt: Date };

async function release(actionId: string, status: "PROPOSED" | "CANCELLED" | "FAILED"): Promise<void> {
  await db.askAction.updateMany({ where: { id: actionId, status: "EXECUTING" }, data: { status, claimedAt: null } });
}

export const confirmAskAction = defineAction(confirmActionSchema, async ({ actionId, timeZone, edits }, { person }) => {
  const verdict = await consumeRate("askAct", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, askActionMessages.rateLimited);
  const env = buildEnv(timeZone);
  const window = localDayWindow(timeZone, env.now);

  const claim = await db.$transaction(async (tx): Promise<Claim> => {
    await lockAssists(tx, person.id);
    const row = await tx.askAction.findFirst({
      where: { id: actionId, personId: person.id, status: "PROPOSED" },
      select: { id: true, intent: true, fingerprint: true, expiresAt: true },
    });
    if (!row) return { state: "missing" };
    const { plan } = await tx.person.findUniqueOrThrow({ where: { id: person.id }, select: { plan: true } });
    if ((await countUsed(tx, person.id, window, env.now)) >= dailyLimit(plan)) return { state: "limit" };
    const claimed = await tx.askAction.updateMany({ where: { id: row.id, status: "PROPOSED" }, data: { status: "EXECUTING", claimedAt: env.now } });
    return claimed.count === 1 ? { state: "claimed", intent: row.intent, fingerprint: row.fingerprint, expiresAt: row.expiresAt } : { state: "missing" };
  });
  if (claim.state === "missing") return actionFail("conflict", askActionMessages.gone);
  if (claim.state === "limit") return actionOk<AskActResult>({ state: "limit", quota: await getAllowance(person.id, timeZone) });

  try {
    const intent = parseIntent(claim.intent);
    if (!intent) {
      await release(actionId, "CANCELLED");
      return actionFail("conflict", askActionMessages.gone);
    }
    const built = await buildAction(person.id, intent, env);
    if (built.kind !== "ready") {
      await release(actionId, "CANCELLED");
      const gone = built.kind === "denied" ? ({ kind: "denied", denied: built.denied } as const) : built.kind === "note" ? ({ kind: "note", note: built.note } as const) : null;
      if (!gone) return actionFail("conflict", askActionMessages.gone);
      return actionOk<AskActResult>({ state: "gone", gone, quota: await getAllowance(person.id, timeZone) });
    }
    if (built.fingerprint !== claim.fingerprint || claim.expiresAt.getTime() <= env.now.getTime()) {
      await db.askAction.updateMany({
        where: { id: actionId, status: "EXECUTING" },
        data: { status: "PROPOSED", claimedAt: null, intent: toJson(built.intent), fingerprint: built.fingerprint, expiresAt: new Date(env.now.getTime() + ACTION_TTL_MS) },
      });
      return actionOk<AskActResult>({ state: "stale", action: { id: actionId, card: built.card }, quota: await getAllowance(person.id, timeZone) });
    }

    const result = await executeAction(person.id, built, edits);
    if (!result.ok) {
      await release(actionId, "PROPOSED");
      return result;
    }
    await db.askAction.updateMany({
      where: { id: actionId, status: "EXECUTING" },
      data: { status: "DONE", executedAt: new Date(), result: toJson({ outcome: result.data.outcome, settlementId: result.data.settlementId }) },
    });
    return actionOk<AskActResult>({ state: "done", outcome: result.data.outcome, quota: await getAllowance(person.id, timeZone) });
  } catch (error) {
    await release(actionId, "PROPOSED").catch(() => undefined);
    throw error;
  }
});

export const cancelAskAction = defineAction(actionRefSchema, async ({ actionId }, { person }) => {
  const verdict = await consumeRate("askAct", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, askActionMessages.rateLimited);
  await db.askAction.updateMany({ where: { id: actionId, personId: person.id, status: "PROPOSED" }, data: { status: "CANCELLED" } });
  return actionOk({ cancelled: true });
});

function settlementOf(result: unknown): string | null {
  if (typeof result !== "object" || result === null) return null;
  const id = (result as { settlementId?: unknown }).settlementId;
  return typeof id === "string" && id !== "" ? id : null;
}

export const undoAskAction = defineAction(actionRefSchema, async ({ actionId, timeZone }, { person }) => {
  const verdict = await consumeRate("askAct", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, askActionMessages.rateLimited);
  const row = await db.askAction.findFirst({ where: { id: actionId, personId: person.id, status: "DONE", kind: "recordPayment" }, select: { result: true } });
  const settlementId = row ? settlementOf(row.result) : null;
  if (!settlementId) return actionFail("conflict", askActionMessages.cantUndo);
  const undone = await undoSettlement({ settlementId });
  if (!undone.ok) return undone;
  await db.askAction.updateMany({ where: { id: actionId, personId: person.id, status: "DONE" }, data: { status: "UNDONE" } });
  return actionOk({ quota: await getAllowance(person.id, timeZone) });
});

type ProposedReply = Extract<AskReply, { kind: "action" | "note" | "denied" }>;

export const proposeAskAction = defineAction(proposeActionSchema, async ({ action, personId, groupId, threadId, timeZone }, { person }) => {
  const verdict = await consumeRate("askPropose", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, askActionMessages.rateLimited);
  const env = buildEnv(timeZone);
  const intent = { ...EMPTY_INTENT, action, personId, groupId, portion: "all" as const };
  const first = await buildAction(person.id, intent, env);
  const [likeliest] = first.kind === "clarify" ? first.question.options : [];
  const built = first.kind === "clarify" && likeliest ? await buildAction(person.id, applyPick(first.intent, { slot: first.question.slot, ref: likeliest.ref }), env) : first;
  if (built.kind === "clarify") return actionFail("conflict", askActionMessages.gone);
  const { reply } = await settleBuilt(person.id, built, env, { questionId: null, threadId });
  if (reply.kind === "answer" || reply.kind === "clarify") return actionFail("conflict", askActionMessages.gone);
  return actionOk<ProposedReply>(reply);
});
