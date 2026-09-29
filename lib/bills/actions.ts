"use server";

import { revalidatePath } from "next/cache";
import { activity } from "@/lib/activity";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk, type ActionResult } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { canAddBill, canEditBill, type Membership } from "@/lib/domain/permissions";
import type { Cents } from "@/lib/money";
import { uniqueSlug } from "@/lib/slug";
import { changedFields } from "./diff";
import { toBillInput } from "./input";
import { billMessages, splitErrorMessage } from "./messages";
import { billRefSchema, createBillSchema, updateBillSchema, type BillValues } from "./schema";
import { computeShares } from "./split";
import { itemCreates, occurredAtOf, participantRows, peopleOnBill, tipColumns } from "./write";

export interface CreatedBill {
  readonly id: string;
  readonly slug: string;
  readonly groupId: string;
  readonly title: string;
  readonly total: Cents;
}

export interface UpdatedBill {
  readonly slug: string;
  readonly groupId: string;
  readonly title: string;
}

export interface DeletedBill {
  readonly groupId: string;
  readonly title: string;
}

async function slugFor(title: string): Promise<string> {
  return uniqueSlug(title, async (slug) => (await db.bill.count({ where: { slug } })) > 0);
}

async function loadGroup(groupId: string) {
  const group = await db.group.findFirst({
    where: { id: groupId, deletedAt: null },
    select: { currency: true, members: { where: { leftAt: null }, select: { personId: true, role: true, leftAt: true } } },
  });
  if (!group) return null;
  const roster: Membership[] = group.members.map((m) => ({
    groupId: toGroupId(groupId),
    personId: toPersonId(m.personId),
    role: m.role,
    leftAt: m.leftAt,
  }));
  return { currency: group.currency, roster };
}

function checkPeople(values: BillValues, allowed: ReadonlySet<string>): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!allowed.has(values.payerId)) fields.payerId = billMessages.payerNotMember;
  if (peopleOnBill(values).some((id) => !allowed.has(id))) fields.participants = billMessages.unknownPerson;
  return fields;
}

function splitTotal(values: BillValues, currency: CurrencyCode): ActionResult<Cents> {
  const split = computeShares(toBillInput(values));
  if (split.ok) return actionOk(split.value.totals.total);
  const message = splitErrorMessage(split.error, currency);
  return actionInvalid({ split: message }, message);
}

function billColumns(values: BillValues, total: Cents) {
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

function refresh(groupId: string, slug?: string): void {
  revalidatePath(routes.group(groupId));
  revalidatePath(routes.groups);
  revalidatePath(routes.app);
  if (slug) revalidatePath(routes.bill(slug));
}

export const createBill = defineAction(createBillSchema, async (input, { person }) => {
  const group = await loadGroup(input.groupId);
  if (!group) return actionFail("notFound", billMessages.groupGone);
  const me = group.roster.find((m) => m.personId === person.id) ?? null;
  if (!canAddBill(me)) return actionFail("forbidden", billMessages.notMember);
  if (!isCurrencyCode(group.currency)) return actionFail("conflict");
  const currency = group.currency;

  const fields = checkPeople(input, new Set(group.roster.map((m) => m.personId)));
  if (Object.keys(fields).length > 0) return actionInvalid(fields);
  const total = splitTotal(input, currency);
  if (!total.ok) return total;

  const slug = await slugFor(input.title);
  const actor: PersonId = person.id;
  const bill = await db.$transaction(async (tx) => {
    const created = await tx.bill.create({
      data: {
        ...billColumns(input, total.data),
        groupId: input.groupId,
        currency,
        createdById: actor,
        status: "FINALIZED",
        finalizedAt: new Date(),
        slug,
        items: { create: itemCreates(input) },
        participants: { create: participantRows(input) },
      },
      select: { id: true, slug: true },
    });
    const events = [
      activity("BILL_CREATED", { title: input.title, total: total.data, currency, itemCount: input.items.length }),
      activity("BILL_FINALIZED", { title: input.title, total: total.data, currency }),
    ];
    await tx.activityEvent.createMany({
      data: events.map((draft) => ({
        groupId: input.groupId,
        billId: created.id,
        actorId: actor,
        type: draft.type,
        payload: draft.payload,
      })),
    });
    return created;
  });

  refresh(input.groupId);
  return actionOk<CreatedBill>({ id: bill.id, slug: bill.slug, groupId: input.groupId, title: input.title, total: total.data });
});

async function loadEditable(billId: string, you: PersonId) {
  const bill = await db.bill.findFirst({
    where: { id: billId, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      occurredAt: true,
      payerId: true,
      createdById: true,
      status: true,
      deletedAt: true,
      currency: true,
      groupId: true,
      splitMethod: true,
      taxCents: true,
      tipKind: true,
      tipValue: true,
      discountCents: true,
      items: {
        orderBy: { position: "asc" },
        select: { name: true, quantity: true, priceCents: true, claims: { select: { personId: true } } },
      },
      participants: { select: { personId: true, shares: true, percentBps: true, amountCents: true } },
    },
  });
  if (!bill || !bill.groupId) return null;
  const group = await loadGroup(bill.groupId);
  if (!group) return null;
  const me = group.roster.find((m) => m.personId === you) ?? null;
  const allowed = canEditBill(
    you,
    { groupId: toGroupId(bill.groupId), createdById: toPersonId(bill.createdById), status: bill.status, deletedAt: bill.deletedAt },
    me,
  );
  const values: BillValues = {
    title: bill.title,
    occurredOn: bill.occurredAt.toISOString().slice(0, 10),
    payerId: bill.payerId,
    items: bill.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      claimedBy: item.claims.map((c) => c.personId),
    })),
    taxCents: bill.taxCents,
    tip:
      bill.tipKind === "PERCENT"
        ? { kind: "PERCENT", bps: bill.tipValue }
        : bill.tipKind === "AMOUNT"
          ? { kind: "AMOUNT", cents: bill.tipValue }
          : { kind: "NONE" },
    discountCents: bill.discountCents,
    method: bill.splitMethod,
    participants: bill.participants.map((p) => ({ ...p })),
  };
  return { bill, group, groupId: bill.groupId, allowed, values };
}

export const updateBill = defineAction(updateBillSchema, async ({ billId, ...input }, { person }) => {
  const loaded = await loadEditable(billId, person.id);
  if (!loaded) return actionFail("notFound", billMessages.billGone);
  if (!loaded.allowed) return actionFail("forbidden", billMessages.cantEdit);
  const { bill, group, groupId, values: before } = loaded;
  if (!isCurrencyCode(bill.currency)) return actionFail("conflict");

  const allowedPeople = new Set<string>([...group.roster.map((m) => m.personId), ...peopleOnBill(before), before.payerId]);
  const fields = checkPeople(input, allowedPeople);
  if (Object.keys(fields).length > 0) return actionInvalid(fields);
  const total = splitTotal(input, bill.currency);
  if (!total.ok) return total;

  const changes = changedFields(before, input);
  if (changes.length === 0) return actionOk<UpdatedBill>({ slug: bill.slug, groupId, title: bill.title });

  const draft = activity("BILL_UPDATED", { title: input.title, fields: changes });
  await db.$transaction(async (tx) => {
    await tx.bill.update({
      where: { id: bill.id },
      data: {
        ...billColumns(input, total.data),
        items: { deleteMany: {}, create: itemCreates(input) },
        participants: { deleteMany: {}, create: participantRows(input) },
      },
    });
    await tx.activityEvent.create({
      data: { groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload },
    });
  });

  refresh(groupId, bill.slug);
  return actionOk<UpdatedBill>({ slug: bill.slug, groupId, title: input.title });
});

export const deleteBill = defineAction(billRefSchema, async ({ billId }, { person }) => {
  const loaded = await loadEditable(billId, person.id);
  if (!loaded) return actionFail("notFound", billMessages.billGone);
  if (!loaded.allowed) return actionFail("forbidden", billMessages.cantEdit);
  const { bill, groupId } = loaded;

  const draft = activity("BILL_DELETED", { title: bill.title });
  await db.$transaction(async (tx) => {
    await tx.bill.update({ where: { id: bill.id }, data: { deletedAt: new Date() } });
    await tx.activityEvent.create({
      data: { groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload },
    });
  });

  refresh(groupId, bill.slug);
  return actionOk<DeletedBill>({ groupId, title: bill.title });
});
