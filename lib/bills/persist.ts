import "server-only";
import { actionInvalid, actionOk, type ActionResult } from "@/lib/actions/errors";
import type { CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { canEditBill, type Membership } from "@/lib/domain/permissions";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Cents } from "@/lib/money";
import { createCode, uniqueSlug } from "@/lib/slug";
import { toBillInput } from "./input";
import { billMessages, splitErrorMessage } from "./messages";
import type { BillValues } from "./schema";
import { computeShares } from "./split";
import { billTotals } from "./totals";
import type { BillStatus } from "./types";
import { occurredAtOf, participantRows, peopleOnBill, tipColumns } from "./write";

export interface GroupRoster {
  readonly currency: string;
  readonly roster: readonly Membership[];
}

export async function loadGroupRoster(groupId: string): Promise<GroupRoster | null> {
  const group = await db.group.findFirst({
    where: { id: groupId, deletedAt: null },
    select: { currency: true, members: { where: { leftAt: null }, select: { personId: true, role: true, leftAt: true } } },
  });
  if (!group) return null;
  return {
    currency: group.currency,
    roster: group.members.map((m) => ({
      groupId: toGroupId(groupId),
      personId: toPersonId(m.personId),
      role: m.role,
      leftAt: m.leftAt,
    })),
  };
}

export function checkPeople(values: BillValues, allowed: ReadonlySet<string>): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!allowed.has(values.payerId)) fields.payerId = billMessages.payerNotMember;
  if (peopleOnBill(values).some((id) => !allowed.has(id))) fields.participants = billMessages.unknownPerson;
  return fields;
}

export function splitTotal(values: BillValues, currency: CurrencyCode): ActionResult<Cents> {
  const split = computeShares(toBillInput(values));
  if (split.ok) return actionOk(split.value.totals.total);
  const message = splitErrorMessage(split.error, currency);
  return actionInvalid({ split: message }, message);
}

export function claimingTotal(values: BillValues, currency: CurrencyCode): ActionResult<Cents> {
  const input = toBillInput(values);
  const totals = billTotals(
    input.items.map((item) => item.priceCents),
    input,
  );
  if (totals.ok) return actionOk(totals.value.total);
  const message = splitErrorMessage(totals.error, currency);
  return actionInvalid({ discountCents: message }, message);
}

export function billColumns(values: BillValues, total: Cents) {
  return {
    title: values.title,
    occurredAt: occurredAtOf(values.occurredOn),
    payerId: values.payerId,
    splitMethod: values.method,
    taxCents: values.taxCents,
    ...tipColumns(values.tip),
    discountCents: values.discountCents,
    totalCents: total,
  };
}

export async function freeSlug(title: string): Promise<string> {
  return uniqueSlug(title, async (slug) => (await db.bill.count({ where: { slug } })) > 0);
}

export async function freeClaimCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = createCode();
    if ((await db.bill.count({ where: { claimCode: code } })) === 0) return code;
  }
  throw new Error("Could not find a free claim code");
}

function claimsCreate(personIds: readonly string[]) {
  return { create: personIds.map((personId) => ({ personId })) };
}

export interface ItemWrite {
  readonly keepClaims: boolean;
}

export async function writeItems(
  tx: Prisma.TransactionClient,
  billId: string,
  existingIds: ReadonlySet<string>,
  values: BillValues,
  { keepClaims }: ItemWrite,
): Promise<void> {
  const byItems = values.method === "ITEMS";
  const kept = values.items.flatMap((item) => (item.id !== undefined && existingIds.has(item.id) ? [item.id] : []));
  await tx.lineItem.deleteMany({ where: { billId, id: { notIn: kept } } });
  for (const [position, item] of values.items.entries()) {
    const fields = { name: item.name, quantity: item.quantity, priceCents: item.priceCents, position };
    if (item.id !== undefined && existingIds.has(item.id)) {
      await tx.lineItem.update({
        where: { id: item.id },
        data: keepClaims
          ? fields
          : { ...fields, claims: { deleteMany: {}, ...(byItems ? claimsCreate(item.claimedBy) : {}) } },
      });
    } else {
      await tx.lineItem.create({
        data: { ...fields, billId, ...(byItems && !keepClaims ? { claims: claimsCreate(item.claimedBy) } : {}) },
      });
    }
  }
}

export async function writeParticipants(tx: Prisma.TransactionClient, billId: string, values: BillValues): Promise<void> {
  await tx.billParticipant.deleteMany({ where: { billId } });
  await tx.billParticipant.createMany({ data: participantRows(values).map((row) => ({ ...row, billId })) });
}

export function editAccess(
  you: PersonId,
  bill: { groupId: string; createdById: string; status: BillStatus; deletedAt: Date | null },
  roster: readonly Membership[],
): boolean {
  const me = roster.find((m) => m.personId === you) ?? null;
  return canEditBill(
    you,
    { groupId: toGroupId(bill.groupId), createdById: toPersonId(bill.createdById), status: bill.status, deletedAt: bill.deletedAt },
    me,
  );
}
