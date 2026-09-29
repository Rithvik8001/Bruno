import "server-only";
import { activity } from "@/lib/activity";
import { restClaimants } from "@/lib/bills/claims";
import type { BillLine } from "@/lib/bills/types";
import { lineItemId, personId } from "@/lib/domain/ids";
import type { Prisma } from "@/lib/generated/prisma/client";
import { cents } from "@/lib/money";

export interface ClaimTarget {
  readonly id: string;
  readonly title: string;
  readonly groupId: string;
  readonly payerId: string;
}

async function billLines(tx: Prisma.TransactionClient, billId: string): Promise<BillLine[]> {
  const items = await tx.lineItem.findMany({
    where: { billId },
    orderBy: { position: "asc" },
    select: { id: true, priceCents: true, claims: { select: { personId: true } } },
  });
  return items.map((item) => ({
    id: lineItemId(item.id),
    priceCents: cents(item.priceCents),
    claimedBy: item.claims.map((c) => personId(c.personId)),
  }));
}

export async function syncClaimedEvent(tx: Prisma.TransactionClient, bill: ClaimTarget, person: string): Promise<void> {
  const items = await tx.lineItem.findMany({
    where: { billId: bill.id, claims: { some: { personId: person } } },
    orderBy: { position: "asc" },
    select: { name: true, _count: { select: { claims: true } } },
  });
  const existing = await tx.activityEvent.findFirst({
    where: { billId: bill.id, actorId: person, type: "BILL_CLAIMED" },
    select: { id: true },
  });
  if (items.length === 0) {
    if (existing) await tx.activityEvent.delete({ where: { id: existing.id } });
    return;
  }
  const draft = activity("BILL_CLAIMED", {
    title: bill.title,
    personId: person,
    items: items.map((item) => ({ name: item.name, ways: Math.max(1, item._count.claims) })),
  });
  if (existing) {
    await tx.activityEvent.update({ where: { id: existing.id }, data: { payload: draft.payload, createdAt: new Date() } });
    return;
  }
  await tx.activityEvent.create({
    data: { groupId: bill.groupId, billId: bill.id, actorId: person, type: draft.type, payload: draft.payload },
  });
}

export async function claimRest(tx: Prisma.TransactionClient, bill: ClaimTarget): Promise<number> {
  const lines = await billLines(tx, bill.id);
  const unclaimed = lines.filter((line) => line.claimedBy.length === 0 && line.priceCents > 0);
  if (unclaimed.length === 0) return 0;
  const people = restClaimants(lines, personId(bill.payerId));
  await tx.claim.createMany({
    data: unclaimed.flatMap((line) => people.map((person) => ({ lineItemId: line.id, personId: person }))),
    skipDuplicates: true,
  });
  for (const person of people) await syncClaimedEvent(tx, bill, person);
  return unclaimed.length;
}

export async function currentLines(tx: Prisma.TransactionClient, billId: string): Promise<BillLine[]> {
  return billLines(tx, billId);
}
