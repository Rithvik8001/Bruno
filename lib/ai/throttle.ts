import "server-only";
import { db } from "@/lib/db";
import { AI_BREAKER_FAILS, AI_BREAKER_WINDOW_MS, AI_GAP_LOOKBACK, AI_UPSTREAM_FAILURES, retryGapMs } from "./rules";

interface Attempt {
  readonly failed: boolean;
  readonly failure: string | null;
  readonly completedAt: Date | null;
}

const upstream: readonly string[] = AI_UPSTREAM_FAILURES;

const isUpstream = (attempt: Attempt) => attempt.failed && attempt.failure !== null && upstream.includes(attempt.failure);

const secondsUntil = (until: number, now: Date) => Math.max(1, Math.ceil((until - now.getTime()) / 1000));

const newestFirst = (a: Attempt, b: Attempt) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0);

async function recentAttempts(personId: string): Promise<Attempt[]> {
  const select = { status: true, failure: true, completedAt: true } as const;
  const [scans, drafts] = await Promise.all([
    db.receiptScan.findMany({
      where: { personId, startedAt: { not: null }, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: AI_GAP_LOOKBACK,
      select,
    }),
    db.tellDraft.findMany({
      where: { personId, startedAt: { not: null }, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: AI_GAP_LOOKBACK,
      select,
    }),
  ]);
  return [...scans, ...drafts]
    .map((row) => ({ failed: row.status === "FAILED", failure: row.failure, completedAt: row.completedAt }))
    .sort(newestFirst)
    .slice(0, AI_GAP_LOOKBACK);
}

export async function personCooldown(personId: string, now: Date = new Date()): Promise<number | null> {
  const recent = await recentAttempts(personId);
  const streak = recent.findIndex((attempt) => !isUpstream(attempt));
  const failures = streak === -1 ? recent.length : streak;
  const last = recent[0]?.completedAt;
  if (failures === 0 || !last) return null;
  const until = last.getTime() + retryGapMs(failures);
  return now.getTime() < until ? secondsUntil(until, now) : null;
}

export async function breakerCooldown(now: Date = new Date()): Promise<number | null> {
  const failure = { in: [...upstream] };
  const completedAt = { gt: new Date(now.getTime() - AI_BREAKER_WINDOW_MS) };
  const page = { orderBy: { completedAt: "desc" }, take: AI_BREAKER_FAILS, select: { completedAt: true } } as const;
  const [scans, drafts] = await Promise.all([
    db.receiptScan.findMany({ where: { status: "FAILED", failure, completedAt }, ...page }),
    db.tellDraft.findMany({ where: { status: "FAILED", failure, completedAt }, ...page }),
  ]);
  const times = [...scans, ...drafts]
    .flatMap((row) => (row.completedAt ? [row.completedAt.getTime()] : []))
    .sort((a, b) => b - a);
  const oldest = times[AI_BREAKER_FAILS - 1];
  return oldest === undefined ? null : secondsUntil(oldest + AI_BREAKER_WINDOW_MS, now);
}

export async function aiCooldown(personId: string): Promise<number | null> {
  return (await personCooldown(personId)) ?? (await breakerCooldown());
}
