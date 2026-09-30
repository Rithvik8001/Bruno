import "server-only";
import { db } from "@/lib/db";
import { cents, type Cents } from "@/lib/money";
import type { ScanResult } from "./result";
import { DUPLICATE_WINDOW_DAYS } from "./rules";

export interface DuplicateBill {
  readonly slug: string;
  readonly title: string;
  readonly occurredOn: string;
  readonly total: Cents;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function findDuplicate(groupId: string, result: ScanResult, today: string): Promise<DuplicateBill | null> {
  const day = result.occurredOn ?? today;
  const at = new Date(`${day}T12:00:00.000Z`);
  const from = new Date(at.getTime() - DUPLICATE_WINDOW_DAYS * DAY_MS);
  const to = new Date(at.getTime() + DUPLICATE_WINDOW_DAYS * DAY_MS);
  const sameDayStart = new Date(`${day}T00:00:00.000Z`);
  const sameDayEnd = new Date(sameDayStart.getTime() + DAY_MS);

  const byTotal = result.printedTotal === null ? [] : [{ totalCents: result.printedTotal, occurredAt: { gte: from, lte: to } }];
  const byTitle =
    result.merchant === null
      ? []
      : [{ title: { equals: result.merchant, mode: "insensitive" as const }, occurredAt: { gte: sameDayStart, lt: sameDayEnd } }];
  if (byTotal.length === 0 && byTitle.length === 0) return null;

  const row = await db.bill.findFirst({
    where: { groupId, deletedAt: null, status: { in: ["FINALIZED", "CLAIMING"] }, OR: [...byTotal, ...byTitle] },
    orderBy: { occurredAt: "desc" },
    select: { slug: true, title: true, occurredAt: true, totalCents: true },
  });
  if (!row) return null;
  return { slug: row.slug, title: row.title, occurredOn: row.occurredAt.toISOString().slice(0, 10), total: cents(row.totalCents) };
}
