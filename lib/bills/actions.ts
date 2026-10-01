"use server";

import { after } from "next/server";
import { activity } from "@/lib/activity";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk } from "@/lib/actions/errors";
import { isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import type { PersonId } from "@/lib/domain/ids";
import { canAddBill } from "@/lib/domain/permissions";
import type { Cents } from "@/lib/money";
import { broadcastBill } from "@/lib/realtime/broadcast";
import { refreshGroup } from "@/lib/revalidate";
import { createPendingGuests } from "@/lib/members/guests";
import { resolveGuests } from "@/lib/members/pending";
import { consumeScan, keepReceipt, ScanGoneError } from "@/lib/scans/consume";
import { scanMessages } from "@/lib/scans/messages";
import { consumeTellDraft, TellGoneError } from "@/lib/tell/consume";
import { tellMessages } from "@/lib/tell/messages";
import { changedFields } from "./diff";
import { billMessages } from "./messages";
import {
  admitGuests,
  billColumns,
  checkPeople,
  claimingTotal,
  editAccess,
  freeSlug,
  loadGroupRoster,
  splitTotal,
  writeItems,
  writeParticipants,
} from "./persist";
import { billRefSchema, createBillSchema, updateBillSchema, type BillValues } from "./schema";
import { itemCreates, participantRows, peopleOnBill } from "./write";

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
  readonly claimCode: string | null;
}

export interface DeletedBill {
  readonly groupId: string;
  readonly title: string;
}

export const createBill = defineAction(createBillSchema, async (input, { person }) => {
  const group = await loadGroupRoster(input.groupId);
  if (!group) return actionFail("notFound", billMessages.groupGone);
  const me = group.roster.find((m) => m.personId === person.id) ?? null;
  if (!canAddBill(me)) return actionFail("forbidden", billMessages.notMember);
  if (!isCurrencyCode(group.currency)) return actionFail("conflict");
  const currency = group.currency;

  const actor: PersonId = person.id;
  const admitted = await admitGuests(input, input.newGuests, group, actor);
  if (!admitted.ok) return admitted;
  const fields = checkPeople(input, admitted.data.allowed);
  if (Object.keys(fields).length > 0) return actionInvalid(fields);
  const total = splitTotal(input, currency);
  if (!total.ok) return total;

  const slug = await freeSlug(input.title);
  const bill = await db.$transaction(async (tx) => {
    const receiptScanId = await consumeScan(tx, input.receiptScanId, actor, input.groupId);
    await consumeTellDraft(tx, input.tellDraftId, actor, input.groupId);
    const created = await createPendingGuests(tx, { groupId: input.groupId, addedById: actor, guests: admitted.data.guests });
    const values = resolveGuests(input, created);
    const saved = await tx.bill.create({
      data: {
        ...billColumns(values, total.data),
        groupId: input.groupId,
        currency,
        createdById: actor,
        status: "FINALIZED",
        finalizedAt: new Date(),
        slug,
        receiptScanId,
        items: { create: itemCreates(values) },
        participants: { create: participantRows(values) },
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
        billId: saved.id,
        actorId: actor,
        type: draft.type,
        payload: draft.payload,
      })),
    });
    return { ok: true as const, saved };
  }).catch((error: unknown) =>
    error instanceof ScanGoneError
      ? { ok: false as const, message: scanMessages.gone }
      : error instanceof TellGoneError
        ? { ok: false as const, message: tellMessages.gone }
        : Promise.reject(error),
  );
  if (!bill.ok) return actionFail("conflict", bill.message);

  if (input.receiptScanId) after(() => keepReceipt(input.receiptScanId ?? "", bill.saved.id));
  refreshGroup(input.groupId);
  return actionOk<CreatedBill>({ id: bill.saved.id, slug: bill.saved.slug, groupId: input.groupId, title: input.title, total: total.data });
});

async function loadEditable(billId: string, you: PersonId) {
  const bill = await db.bill.findFirst({
    where: { id: billId, deletedAt: null },
    select: {
      id: true,
      slug: true,
      claimCode: true,
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
        select: { id: true, name: true, quantity: true, priceCents: true, category: true, claims: { select: { personId: true } } },
      },
      participants: { select: { personId: true, shares: true, percentBps: true, amountCents: true } },
    },
  });
  if (!bill || !bill.groupId) return null;
  const group = await loadGroupRoster(bill.groupId);
  if (!group) return null;
  const allowed = editAccess(you, { ...bill, groupId: bill.groupId }, group.roster);
  const values: BillValues = {
    title: bill.title,
    occurredOn: bill.occurredAt.toISOString().slice(0, 10),
    payerId: bill.payerId,
    items: bill.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      claimedBy: item.claims.map((c) => c.personId),
      category: item.category,
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
  const currency = bill.currency;

  const claiming = bill.status === "CLAIMING";
  const keepClaims = claiming && input.method === "ITEMS";
  const finalizing = claiming && !keepClaims;
  const next: BillValues = keepClaims
    ? {
        ...input,
        items: input.items.map((item) => ({
          ...item,
          claimedBy: before.items.find((b) => b.id === item.id)?.claimedBy ?? [],
        })),
      }
    : input;

  const allowedPeople = new Set<string>([...group.roster.map((m) => m.personId), ...peopleOnBill(before), before.payerId]);
  const fields = checkPeople(next, allowedPeople);
  if (Object.keys(fields).length > 0) return actionInvalid(fields);
  const total = keepClaims ? claimingTotal(next, currency) : splitTotal(next, currency);
  if (!total.ok) return total;

  const changes = changedFields(before, next).filter((field) => !keepClaims || field !== "split");
  const result: UpdatedBill = {
    slug: bill.slug,
    groupId,
    title: next.title,
    claimCode: keepClaims ? bill.claimCode : null,
  };
  if (changes.length === 0 && !finalizing) return actionOk(result);

  const existingIds = new Set(before.items.flatMap((item) => (item.id === undefined ? [] : [item.id])));
  await db.$transaction(async (tx) => {
    await tx.bill.update({
      where: { id: bill.id },
      data: { ...billColumns(next, total.data), ...(finalizing ? { status: "FINALIZED", finalizedAt: new Date() } : {}) },
    });
    await writeItems(tx, bill.id, existingIds, next, { keepClaims });
    if (!keepClaims) await writeParticipants(tx, bill.id, next);
    const events = [
      ...(changes.length > 0 ? [activity("BILL_UPDATED", { title: next.title, fields: changes })] : []),
      ...(finalizing ? [activity("BILL_FINALIZED", { title: next.title, total: total.data, currency })] : []),
    ];
    await tx.activityEvent.createMany({
      data: events.map((draft) => ({ groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload })),
    });
  });

  refreshGroup(groupId);
  const code = bill.claimCode;
  if (claiming && code) after(() => broadcastBill(code, finalizing ? "status" : "claims"));
  return actionOk(result);
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

  refreshGroup(groupId);
  const code = bill.claimCode;
  if (bill.status === "CLAIMING" && code) after(() => broadcastBill(code, "status"));
  return actionOk<DeletedBill>({ groupId, title: bill.title });
});
