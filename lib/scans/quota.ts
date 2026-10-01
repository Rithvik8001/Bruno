import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Plan } from "@/lib/generated/prisma/enums";
import { dailyLimitOverride } from "./config";
import { TELL_STALE_MS } from "@/lib/tell/rules";
import { EXTRACT_STALE_MS, SCAN_LIMITS } from "./rules";

export interface DayWindow {
  readonly start: Date;
  readonly end: Date;
}

export interface ScanQuota {
  readonly used: number;
  readonly limit: number;
  readonly left: number;
  readonly plan: Plan;
}

interface LocalParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function localParts(at: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day") };
}

function offsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

function localMidnight({ year, month, day }: LocalParts, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(first - offsetMs(new Date(first), timeZone) + offsetMs(new Date(guess), timeZone));
}

export function localDayWindow(timeZone: string, now: Date = new Date()): DayWindow {
  const today = localParts(now, timeZone);
  const start = localMidnight(today, timeZone);
  const tomorrow = localParts(new Date(start.getTime() + 36 * 60 * 60 * 1000), timeZone);
  return { start, end: localMidnight(tomorrow, timeZone) };
}

export function dailyLimit(plan: Plan): number {
  return dailyLimitOverride() ?? SCAN_LIMITS[plan];
}

export async function countUsed(
  tx: Prisma.TransactionClient,
  personId: string,
  window: DayWindow,
  now: Date = new Date(),
): Promise<number> {
  const startedAt = { gte: window.start, lt: window.end };
  const [scans, drafts] = await Promise.all([
    tx.receiptScan.count({
      where: {
        personId,
        startedAt,
        OR: [{ status: { in: ["SUCCEEDED", "CONSUMED", "DISCARDED"] } }, { status: "EXTRACTING", startedAt: { gt: new Date(now.getTime() - EXTRACT_STALE_MS) } }],
      },
    }),
    tx.tellDraft.count({
      where: {
        personId,
        startedAt,
        OR: [{ status: { in: ["SUCCEEDED", "CONSUMED", "DISCARDED"] } }, { status: "DRAFTING", startedAt: { gt: new Date(now.getTime() - TELL_STALE_MS) } }],
      },
    }),
  ]);
  return scans + drafts;
}

export async function countTellAttempts(tx: Prisma.TransactionClient, personId: string, window: DayWindow): Promise<number> {
  return tx.tellDraft.count({ where: { personId, startedAt: { gte: window.start, lt: window.end } } });
}

export function quotaOf(used: number, plan: Plan): ScanQuota {
  const limit = dailyLimit(plan);
  return { used, limit, left: Math.max(0, limit - used), plan };
}
