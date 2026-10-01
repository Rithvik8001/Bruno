import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Plan } from "@/lib/generated/prisma/enums";
import { localDayWindow, type DayWindow } from "@/lib/scans/quota";
import { askLimitOverride } from "./config";
import type { AskQuota } from "./result";
import { ASK_DECLINE_LOOKBACK, ASK_LIMITS, ASK_STALE_MS, declineGapMs } from "./rules";

type Client = Prisma.TransactionClient | typeof db;

export function askLimit(plan: Plan): number {
  return askLimitOverride() ?? ASK_LIMITS[plan];
}

export async function countAsked(client: Client, personId: string, window: DayWindow, now: Date = new Date()): Promise<number> {
  return client.askQuestion.count({
    where: {
      personId,
      startedAt: { gte: window.start, lt: window.end },
      OR: [{ status: "ANSWERED" }, { status: "ASKING", startedAt: { gt: new Date(now.getTime() - ASK_STALE_MS) } }],
    },
  });
}

export async function countAskAttempts(client: Client, personId: string, window: DayWindow): Promise<number> {
  return client.askQuestion.count({ where: { personId, startedAt: { gte: window.start, lt: window.end } } });
}

export async function isAsking(client: Client, personId: string, now: Date = new Date()): Promise<boolean> {
  const row = await client.askQuestion.findFirst({
    where: { personId, status: "ASKING", startedAt: { gt: new Date(now.getTime() - ASK_STALE_MS) } },
    select: { id: true },
  });
  return row !== null;
}

export function askQuotaOf(used: number, plan: Plan): AskQuota {
  const limit = askLimit(plan);
  return { used, limit, left: Math.max(0, limit - used), plan };
}

export async function getAskQuota(personId: string, timeZone: string): Promise<AskQuota> {
  const person = await db.person.findUniqueOrThrow({ where: { id: personId }, select: { plan: true } });
  return askQuotaOf(await countAsked(db, personId, localDayWindow(timeZone)), person.plan);
}

export async function askDeclineCooldown(personId: string, now: Date = new Date()): Promise<number | null> {
  const recent = await db.askQuestion.findMany({
    where: { personId, completedAt: { not: null }, status: { in: ["ANSWERED", "CLARIFY", "DECLINED"] } },
    orderBy: { completedAt: "desc" },
    take: ASK_DECLINE_LOOKBACK,
    select: { status: true, outcome: true, completedAt: true },
  });
  const offTopic = (row: (typeof recent)[number]) => row.status === "DECLINED" && row.outcome === "outOfScope";
  const firstOther = recent.findIndex((row) => !offTopic(row));
  const streak = firstOther === -1 ? recent.length : firstOther;
  const last = recent[0]?.completedAt;
  if (!last) return null;
  const until = last.getTime() + declineGapMs(streak);
  return now.getTime() < until ? Math.max(1, Math.ceil((until - now.getTime()) / 1000)) : null;
}
