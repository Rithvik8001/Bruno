"use server";

import { revalidatePath } from "next/cache";
import { activity } from "@/lib/activity";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { canAddBill, type Membership } from "@/lib/domain/permissions";
import type { Cents } from "@/lib/money";
import { uniqueSlug } from "@/lib/slug";
import { toBillInput } from "./input";
import { billMessages, splitErrorMessage } from "./messages";
import { createBillSchema, type BillTipValue, type CreateBillValues } from "./schema";
import { computeShares } from "./split";

export interface CreatedBill {
  readonly id: string;
  readonly slug: string;
  readonly groupId: string;
  readonly title: string;
  readonly total: Cents;
}

interface ParticipantRow {
  readonly personId: string;
  readonly shares: number;
  readonly percentBps: number | null;
  readonly amountCents: number | null;
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

function peopleOnBill(input: CreateBillValues): string[] {
  return input.method === "ITEMS"
    ? input.items.flatMap((item) => item.claimedBy)
    : input.participants.map((p) => p.personId);
}

function participantRows(input: CreateBillValues): ParticipantRow[] {
  if (input.method === "ITEMS") {
    return [...new Set(peopleOnBill(input))].map((personId) => ({ personId, shares: 1, percentBps: null, amountCents: null }));
  }
  return input.participants.map((p) => ({
    personId: p.personId,
    shares: input.method === "SHARES" ? p.shares : 1,
    percentBps: input.method === "PERCENT" ? p.percentBps : null,
    amountCents: input.method === "AMOUNT" ? p.amountCents : null,
  }));
}

function tipColumns(tip: BillTipValue) {
  switch (tip.kind) {
    case "NONE":
      return { tipKind: "NONE", tipValue: 0 } as const;
    case "PERCENT":
      return { tipKind: "PERCENT", tipValue: tip.bps } as const;
    case "AMOUNT":
      return { tipKind: "AMOUNT", tipValue: tip.cents } as const;
  }
}

const occurredAt = (day: string) => new Date(`${day}T12:00:00.000Z`);

function refresh(groupId: string): void {
  revalidatePath(routes.group(groupId));
  revalidatePath(routes.groups);
  revalidatePath(routes.app);
}

export const createBill = defineAction(createBillSchema, async (input, { person }) => {
  const group = await loadGroup(input.groupId);
  if (!group) return actionFail("notFound", billMessages.groupGone);
  const me = group.roster.find((m) => m.personId === person.id) ?? null;
  if (!canAddBill(me)) return actionFail("forbidden", billMessages.notMember);
  if (!isCurrencyCode(group.currency)) return actionFail("conflict");
  const currency = group.currency;

  const members = new Set<string>(group.roster.map((m) => m.personId));
  const fields: Record<string, string> = {};
  if (!members.has(input.payerId)) fields.payerId = billMessages.payerNotMember;
  if (peopleOnBill(input).some((id) => !members.has(id))) fields.participants = billMessages.unknownPerson;
  if (Object.keys(fields).length > 0) return actionInvalid(fields);

  const split = computeShares(toBillInput(input));
  if (!split.ok) {
    const message = splitErrorMessage(split.error, currency);
    return actionInvalid({ split: message }, message);
  }
  const total = split.value.totals.total;
  const slug = await slugFor(input.title);
  const actor: PersonId = person.id;

  const bill = await db.$transaction(async (tx) => {
    const created = await tx.bill.create({
      data: {
        groupId: input.groupId,
        title: input.title,
        occurredAt: occurredAt(input.occurredOn),
        currency,
        payerId: input.payerId,
        createdById: actor,
        status: "FINALIZED",
        finalizedAt: new Date(),
        splitMethod: input.method,
        taxCents: input.taxCents,
        ...tipColumns(input.tip),
        discountCents: input.discountCents,
        totalCents: total,
        slug,
        items: {
          create: input.items.map((item, position) => ({
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
            position,
            claims:
              input.method === "ITEMS" ? { create: item.claimedBy.map((personId) => ({ personId })) } : undefined,
          })),
        },
        participants: { create: participantRows(input) },
      },
      select: { id: true, slug: true },
    });
    const events = [
      activity("BILL_CREATED", { title: input.title, total, currency, itemCount: input.items.length }),
      activity("BILL_FINALIZED", { title: input.title, total, currency }),
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
  return actionOk<CreatedBill>({ id: bill.id, slug: bill.slug, groupId: input.groupId, title: input.title, total });
});
