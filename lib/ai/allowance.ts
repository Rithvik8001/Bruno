import "server-only";
import { ACTION_STALE_MS } from "@/lib/ask/actions/kinds";
import { ASK_STALE_MS } from "@/lib/ask/rules";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Plan } from "@/lib/generated/prisma/enums";
import { EXTRACT_STALE_MS } from "@/lib/scans/rules";
import { TELL_STALE_MS } from "@/lib/tell/rules";
import { limitOverride } from "./config";
import { AI_FREE_MISSES, AI_LIMITS, allowanceOf, type Allowance } from "./rules";

type Client = Prisma.TransactionClient | typeof db;

export interface DayWindow {
  readonly start: Date;
  readonly end: Date;
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
  return limitOverride() ?? AI_LIMITS[plan];
}

export async function countUsed(client: Client, personId: string, window: DayWindow, now: Date = new Date()): Promise<number> {
  const startedAt = { gte: window.start, lt: window.end };
  const fresh = (staleMs: number) => ({ gt: new Date(now.getTime() - staleMs) });
  const scans = await client.receiptScan.count({
    where: {
      personId,
      startedAt,
      OR: [{ status: { in: ["SUCCEEDED", "CONSUMED", "DISCARDED"] } }, { status: "EXTRACTING", startedAt: fresh(EXTRACT_STALE_MS) }],
    },
  });
  const drafts = await client.tellDraft.count({
    where: {
      personId,
      startedAt,
      OR: [{ status: { in: ["SUCCEEDED", "CONSUMED", "DISCARDED"] } }, { status: "DRAFTING", startedAt: fresh(TELL_STALE_MS) }],
    },
  });
  const questions = await client.askQuestion.count({
    where: {
      personId,
      startedAt,
      OR: [{ status: "ANSWERED" }, { status: "ASKING", startedAt: fresh(ASK_STALE_MS) }],
    },
  });
  const actions = await client.askAction.count({
    where: {
      personId,
      OR: [
        { status: { in: ["DONE", "UNDONE"] }, executedAt: startedAt },
        { status: "EXECUTING", claimedAt: fresh(ACTION_STALE_MS) },
      ],
    },
  });
  return scans + drafts + questions + actions;
}

export async function countAttempts(client: Client, personId: string, window: DayWindow): Promise<number> {
  const where = { personId, startedAt: { gte: window.start, lt: window.end } };
  const scans = await client.receiptScan.count({ where });
  const drafts = await client.tellDraft.count({ where });
  const questions = await client.askQuestion.count({ where });
  return scans + drafts + questions;
}

export type AssistVerdict =
  | { readonly ok: true; readonly limit: number }
  | { readonly ok: false; readonly reason: "quota" | "tries"; readonly limit: number };

async function planOf(client: Client, personId: string): Promise<Plan> {
  const person = await client.person.findUniqueOrThrow({ where: { id: personId }, select: { plan: true } });
  return person.plan;
}

export async function checkAssist(client: Client, personId: string, window: DayWindow): Promise<AssistVerdict> {
  const limit = dailyLimit(await planOf(client, personId));
  if ((await countUsed(client, personId, window)) >= limit) return { ok: false, reason: "quota", limit };
  if ((await countAttempts(client, personId, window)) >= limit + AI_FREE_MISSES) return { ok: false, reason: "tries", limit };
  return { ok: true, limit };
}

export async function lockAssists(tx: Prisma.TransactionClient, personId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${personId}))`;
}

export async function reserveAssist(tx: Prisma.TransactionClient, personId: string, window: DayWindow): Promise<AssistVerdict> {
  await lockAssists(tx, personId);
  return checkAssist(tx, personId, window);
}

export async function getAllowance(personId: string, timeZone: string): Promise<Allowance> {
  const plan = await planOf(db, personId);
  const used = await countUsed(db, personId, localDayWindow(timeZone));
  return allowanceOf(used, dailyLimit(plan), plan);
}
