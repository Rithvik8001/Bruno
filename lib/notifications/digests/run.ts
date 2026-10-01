import "server-only";
import { db } from "@/lib/db";
import { personId } from "@/lib/domain/ids";
import type { EmailRecipient } from "../recipients";
import { localClock, monthlyDue, previousMonth, weeklyDue } from "./clock";
import { sendMonthlyRecap, sendWeeklyNudge } from "./send";

const BATCH_MAX = 150;
const CONCURRENCY = 4;

interface DigestTask {
  readonly dedupeKey: string;
  readonly run: () => Promise<boolean>;
}

export interface DigestRun {
  readonly due: number;
  readonly processed: number;
  readonly sent: number;
  readonly failed: number;
}

async function dueTasks(now: Date): Promise<DigestTask[]> {
  const people = await db.person.findMany({
    where: {
      mergedIntoId: null,
      onboardedAt: { not: null },
      user: { emailVerified: true },
      OR: [{ notifyWeekly: true }, { notifyMonthly: true }],
      memberships: { some: { leftAt: null, group: { deletedAt: null } } },
    },
    select: {
      id: true,
      displayName: true,
      timeZone: true,
      notifyWeekly: true,
      notifyMonthly: true,
      user: { select: { email: true } },
    },
  });
  return people.flatMap((row): DigestTask[] => {
    if (!row.user) return [];
    const recipient: EmailRecipient = {
      personId: personId(row.id),
      email: row.user.email,
      displayName: row.displayName,
      timeZone: row.timeZone,
    };
    const clock = localClock(row.timeZone, now);
    const month = previousMonth(clock);
    const weeklyKey = `weekly/${row.id}/${clock.date}`;
    const monthlyKey = `monthly/${row.id}/${month.key}`;
    return [
      ...(row.notifyWeekly && weeklyDue(clock)
        ? [{ dedupeKey: weeklyKey, run: () => sendWeeklyNudge(recipient, weeklyKey, now) }]
        : []),
      ...(row.notifyMonthly && monthlyDue(clock)
        ? [{ dedupeKey: monthlyKey, run: () => sendMonthlyRecap(recipient, monthlyKey, month, now) }]
        : []),
    ];
  });
}

async function withoutSent(tasks: readonly DigestTask[]): Promise<DigestTask[]> {
  if (tasks.length === 0) return [];
  const done = await db.emailLog.findMany({
    where: { dedupeKey: { in: tasks.map((task) => task.dedupeKey) } },
    select: { dedupeKey: true },
  });
  const keys = new Set(done.map((row) => row.dedupeKey));
  return tasks.filter((task) => !keys.has(task.dedupeKey));
}

export async function runDigests(now: Date = new Date()): Promise<DigestRun> {
  const due = await withoutSent(await dueTasks(now));
  const batch = due.slice(0, BATCH_MAX);
  let sent = 0;
  let failed = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < batch.length) {
      const task = batch[cursor++];
      if (!task) return;
      try {
        if (await task.run()) sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[digest] ${task.dedupeKey} failed`, error);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { due: due.length, processed: batch.length, sent, failed };
}
