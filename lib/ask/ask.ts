import "server-only";
import { checkAssist, countUsed, dailyLimit, localDayWindow, lockAssists, type DayWindow } from "@/lib/ai/allowance";
import { aiMessages, allowanceCopy } from "@/lib/ai/messages";
import { allowanceOf, type Allowance } from "@/lib/ai/rules";
import { aiCooldown, breakerCooldown } from "@/lib/ai/throttle";
import type { ActionError } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import type { PersonId } from "@/lib/domain/ids";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { AskStatus, Plan } from "@/lib/generated/prisma/enums";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { buildAskContext, loadAskAccount, type AskAccount } from "./account";
import { runAsk, type AskUsage } from "./agent";
import { isAskConfigured } from "./config";
import { describeCard } from "./describe";
import type { AskTurn } from "./instructions";
import { askMessages } from "./messages";
import { askDeclineCooldown, isAsking } from "./quota";
import { ASK_PERIODS, type AskPeriod, type AskPick, type AskReply, type AskStep, type AskStreamEvent } from "./result";
import { ASK_CONTEXT_TURNS } from "./rules";
import { askHasSubstance, type AskValues } from "./schema";
import { maybeSweepAsk } from "./sweep";
import { periodRange } from "./tools";

export type AskStart =
  | { readonly ok: false; readonly status: number; readonly error: ActionError }
  | { readonly ok: true; readonly run: (emit: (step: AskStep) => void, signal: AbortSignal) => Promise<AskStreamEvent | null> };

interface Trace {
  readonly shown: string;
}

const refuse = (status: number, error: ActionError): AskStart => ({ ok: false, status, error });

const toJson = (value: Trace): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function traceOf(raw: unknown): Trace | null {
  if (typeof raw !== "object" || raw === null) return null;
  const shown = (raw as { shown?: unknown }).shown;
  return typeof shown === "string" ? { shown } : null;
}

function isPeriod(value: string): value is AskPeriod {
  return (ASK_PERIODS as readonly string[]).includes(value);
}

function resolvedLines(account: AskAccount, picks: readonly AskPick[], today: string): string[] {
  return picks.flatMap((pick) => {
    if (pick.slot === "person") {
      const index = account.people.findIndex((person) => person.id === pick.ref);
      return index === -1 ? [] : [`person p${index}`];
    }
    if (pick.slot === "group") {
      const group = account.groups.find((g) => g.id === pick.ref);
      return group ? [`group g${group.index}`] : [];
    }
    if (!isPeriod(pick.ref)) return [];
    const { from, to } = periodRange(pick.ref, today);
    return [from === null ? "period: all time" : `period: ${from} to ${to ?? today}`];
  });
}

async function turnsOf(personId: string, threadId: string, before: string): Promise<AskTurn[]> {
  const rows = await db.askQuestion.findMany({
    where: { personId, threadId, status: "ANSWERED", id: { not: before }, text: { not: null } },
    orderBy: { createdAt: "desc" },
    take: ASK_CONTEXT_TURNS,
    select: { text: true, trace: true },
  });
  return rows.reverse().flatMap((row) => {
    const trace = traceOf(row.trace);
    return row.text && trace ? [{ question: row.text, shown: trace.shown }] : [];
  });
}

async function close(id: string, status: AskStatus, data: { failure?: string; outcome?: string; trace?: Trace; usage?: AskUsage | null }): Promise<void> {
  await db.askQuestion.update({
    where: { id },
    data: {
      status,
      failure: data.failure ?? null,
      outcome: data.outcome ?? null,
      trace: data.trace ? toJson(data.trace) : undefined,
      completedAt: new Date(),
      model: data.usage?.model ?? null,
      inputTokens: data.usage?.inputTokens ?? null,
      outputTokens: data.usage?.outputTokens ?? null,
      steps: data.usage?.steps ?? null,
    },
  });
}

async function quotaNow(personId: string, plan: Plan, window: DayWindow): Promise<Allowance> {
  return allowanceOf(await countUsed(db, personId, window), dailyLimit(plan), plan);
}

export async function startAsk(input: AskValues, person: { readonly id: PersonId }): Promise<AskStart> {
  if (!isAskConfigured()) return refuse(409, { code: "conflict", message: askMessages.unavailable });
  const verdict = await consumeRate("askStart", person.id);
  if (!verdict.ok) return refuse(429, { code: "rateLimited", message: askMessages.rateLimited, retryAfter: verdict.retryAfter });
  const account = await loadAskAccount(person.id, input.groupId);
  if (!account) return refuse(403, { code: "forbidden", message: askMessages.notMember });

  const pending = input.clarifies
    ? await db.askQuestion.findFirst({
        where: { id: input.clarifies.questionId, personId: person.id, status: "CLARIFY", text: { not: null } },
        select: { text: true, threadId: true },
      })
    : null;
  if (input.clarifies && !pending?.text) return refuse(404, { code: "notFound", message: askMessages.gone });
  const question = pending?.text ?? input.text;
  const picks = input.clarifies?.picks ?? [];

  const { plan } = await db.person.findUniqueOrThrow({ where: { id: person.id }, select: { plan: true } });
  const window = localDayWindow(input.timeZone);
  const backHref = routes.askAbout(account.scope?.id ?? null);

  const owned =
    pending?.threadId ??
    (input.threadId && (await db.askQuestion.findFirst({ where: { personId: person.id, threadId: input.threadId }, select: { id: true } })) ? input.threadId : null);
  const threadId = owned ?? crypto.randomUUID();

  if (!askHasSubstance(question)) {
    const quota = await quotaNow(person.id, plan, window);
    const reply: AskReply = { kind: "answer", card: { kind: "decline", reason: "outOfScope", person: null, group: null, settleHref: null } };
    return { ok: true, run: async () => ({ t: "done", reply, quota, questionId: "", threadId }) };
  }

  const cooling = await aiCooldown(person.id);
  if (cooling !== null) return refuse(429, { code: "rateLimited", message: aiMessages.cooling(cooling), retryAfter: cooling });
  const offTopic = await askDeclineCooldown(person.id);
  if (offTopic !== null) return refuse(429, { code: "rateLimited", message: askMessages.offTopic(offTopic), retryAfter: offTopic });

  const reserved = await db.$transaction(async (tx) => {
    await lockAssists(tx, person.id);
    if (await isAsking(tx, person.id)) return { ok: false as const, reason: "busy" as const };
    const assist = await checkAssist(tx, person.id, window);
    if (!assist.ok) return assist;
    const created = await tx.askQuestion.create({
      data: { personId: person.id, threadId, groupId: account.scope?.id ?? null, text: question, timeZone: input.timeZone, status: "ASKING", startedAt: new Date() },
      select: { id: true },
    });
    return { ok: true as const, id: created.id };
  });
  if (!reserved.ok) {
    const message = reserved.reason === "busy" ? askMessages.busy : reserved.reason === "quota" ? allowanceCopy.refused(reserved.limit) : askMessages.tooManyTries;
    return refuse(409, { code: "conflict", message });
  }
  const questionId = reserved.id;
  maybeSweepAsk();

  return {
    ok: true,
    run: async (emit, signal) => {
      let closed = false;
      try {
        const [ctx, turns] = await Promise.all([buildAskContext({ account, timeZone: input.timeZone, backHref, emit }), turnsOf(person.id, threadId, questionId)]);
        const outcome = await runAsk({
          question,
          ctx,
          turns,
          resolved: resolvedLines(account, picks, ctx.today),
          allowClarify: picks.length === 0,
          signal,
        });
        if (outcome.kind === "cancelled") {
          closed = true;
          await close(questionId, "CANCELLED", {});
          return null;
        }
        if (outcome.kind === "failed") {
          closed = true;
          await close(questionId, "FAILED", { failure: outcome.failure, usage: outcome.usage });
          const busy = (await breakerCooldown()) !== null;
          return {
            t: "error",
            code: "unknown",
            message: busy ? askMessages.trouble : askMessages[outcome.failure],
            retryAfter: null,
            quota: await quotaNow(person.id, plan, window),
          };
        }
        const { terminal, usage } = outcome;
        closed = true;
        if (terminal.kind === "clarify") {
          await close(questionId, "CLARIFY", { outcome: "clarify", usage });
          return { t: "done", reply: { kind: "clarify", questions: terminal.questions }, quota: await quotaNow(person.id, plan, window), questionId, threadId };
        }
        if (terminal.kind === "decline" || terminal.card.kind === "decline") {
          const reason = terminal.card.kind === "decline" ? terminal.card.reason : "outOfScope";
          await close(questionId, "DECLINED", { outcome: reason, usage });
          return { t: "done", reply: { kind: "answer", card: terminal.card }, quota: await quotaNow(person.id, plan, window), questionId, threadId };
        }
        await close(questionId, "ANSWERED", { outcome: terminal.card.kind, trace: { shown: describeCard(terminal.card) }, usage });
        return { t: "done", reply: { kind: "answer", card: terminal.card }, quota: await quotaNow(person.id, plan, window), questionId, threadId };
      } catch (error) {
        console.error("[ask] question failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown error");
        if (!closed) await close(questionId, signal.aborted ? "CANCELLED" : "FAILED", signal.aborted ? {} : { failure: "failed" }).catch(() => undefined);
        if (signal.aborted) return null;
        return { t: "error", code: "unknown", message: askMessages.failed, retryAfter: null, quota: await quotaNow(person.id, plan, window) };
      }
    },
  };
}
