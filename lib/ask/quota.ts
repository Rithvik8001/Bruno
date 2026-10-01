import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ASK_DECLINE_LOOKBACK, ASK_STALE_MS, declineGapMs } from "./rules";

type Client = Prisma.TransactionClient | typeof db;

export async function isAsking(client: Client, personId: string, now: Date = new Date()): Promise<boolean> {
  const row = await client.askQuestion.findFirst({
    where: { personId, status: "ASKING", startedAt: { gt: new Date(now.getTime() - ASK_STALE_MS) } },
    select: { id: true },
  });
  return row !== null;
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
