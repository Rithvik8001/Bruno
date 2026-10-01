import "server-only";
import { db } from "@/lib/db";
import { retryGapMs } from "./guard";
import type { TellFailure } from "./messages";
import { TELL_BREAKER_FAILS, TELL_BREAKER_WINDOW_MS, TELL_GAP_LOOKBACK } from "./rules";

export const UPSTREAM_FAILURES = ["timeout", "failed"] as const satisfies readonly TellFailure[];

const isUpstream = (failure: string | null) => failure !== null && (UPSTREAM_FAILURES as readonly string[]).includes(failure);

const secondsUntil = (until: number, now: Date) => Math.max(1, Math.ceil((until - now.getTime()) / 1000));

export async function personCooldown(personId: string, now: Date = new Date()): Promise<number | null> {
  const recent = await db.tellDraft.findMany({
    where: { personId, status: { not: "DRAFTING" } },
    orderBy: { createdAt: "desc" },
    take: TELL_GAP_LOOKBACK,
    select: { status: true, failure: true, completedAt: true },
  });
  const streak = recent.findIndex((row) => row.status !== "FAILED" || !isUpstream(row.failure));
  const failures = streak === -1 ? recent.length : streak;
  const last = recent[0]?.completedAt;
  if (failures === 0 || !last) return null;
  const until = last.getTime() + retryGapMs(failures);
  return now.getTime() < until ? secondsUntil(until, now) : null;
}

export async function breakerCooldown(now: Date = new Date()): Promise<number | null> {
  const recent = await db.tellDraft.findMany({
    where: {
      status: "FAILED",
      failure: { in: [...UPSTREAM_FAILURES] },
      completedAt: { gt: new Date(now.getTime() - TELL_BREAKER_WINDOW_MS) },
    },
    orderBy: { completedAt: "desc" },
    take: TELL_BREAKER_FAILS,
    select: { completedAt: true },
  });
  const oldest = recent[TELL_BREAKER_FAILS - 1]?.completedAt;
  return oldest ? secondsUntil(oldest.getTime() + TELL_BREAKER_WINDOW_MS, now) : null;
}
