"use server";

import { activity } from "@/lib/activity";
import { runInBackground } from "@/lib/background";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk } from "@/lib/actions/errors";
import { formatMoney, isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { openAmount, pairBalance, pendingBetween, settleRole } from "@/lib/ledger/pair";
import type { SettlementStatus } from "@/lib/ledger/rules";
import { canConfirm, canDecline, canUndo, initialSettlement, type SettlementState } from "@/lib/ledger/settlements";
import { cents } from "@/lib/money";
import { notifySettlementChanged, notifySettlementRecorded } from "@/lib/notifications/events/payments";
import { refreshGroup } from "@/lib/revalidate";
import { settlementMessages } from "./messages";
import { stateOf } from "./rows";
import { recordSettlementSchema, settlementRefSchema } from "./schema";

export interface RecordedSettlement {
  readonly id: string;
  readonly status: SettlementStatus;
}

export interface SettlementChange {
  readonly id: string;
  readonly groupId: string;
}

export const recordSettlement = defineAction(recordSettlementSchema, async (input, { person }) => {
  const you: PersonId = person.id;
  if (input.personId === you) return actionFail("invalid", settlementMessages.samePerson);
  const group = await db.group.findFirst({
    where: { id: input.groupId, deletedAt: null },
    select: { currency: true, members: {
        where: { personId: { in: [you, input.personId] } },
        select: { personId: true, leftAt: true, person: { select: { userId: true } } },
      },
    },
  });
  if (!group) return actionFail("notFound", settlementMessages.notMember);
  const me = group.members.find((m) => m.personId === you);
  if (!me || me.leftAt !== null) return actionFail("forbidden", settlementMessages.notMember);
  const counterpart = group.members.find((m) => m.personId === input.personId);
  if (!counterpart) return actionFail("forbidden", settlementMessages.unknownPerson);
  if (!isCurrencyCode(group.currency)) return actionFail("conflict");

  const now = new Date();
  const them = toPersonId(input.personId);
  const scope = { groupId: toGroupId(input.groupId), currency: group.currency };
  const ledger = await loadGroupLedgers([input.groupId]);
  const balance = pairBalance(you, them, ledger.debts, ledger.settlements, scope, now);
  const pendingFromMe = pendingBetween(ledger.settlements, you, them, scope, now);
  const role = settleRole({ balance, pendingToMe: [], pendingFromMe });
  const expected = input.direction === "received" ? "recipient" : "payer";
  if (role !== expected) return actionFail("conflict", settlementMessages.nothingOwed);
  const max = openAmount(role, balance, pendingFromMe);
  if (input.amountCents > max) {
    return actionInvalid({ amountCents: settlementMessages.tooMuch(formatMoney(max, group.currency)) });
  }

  const from = input.direction === "received" ? them : you;
  const to = input.direction === "received" ? you : them;
  const recipientCanConfirm = to === you || counterpart.person.userId !== null;
  const initial = initialSettlement(you, from, to, now, recipientCanConfirm);
  if (!initial.ok) return actionFail("forbidden", settlementMessages.unknownPerson);

  const created = await db.$transaction(async (tx) => {
    const row = await tx.settlement.create({
      data: {
        groupId: input.groupId,
        fromId: from,
        toId: to,
        currency: group.currency,
        amountCents: input.amountCents,
        method: input.method,
        note: input.note,
        recordedById: you,
        ...initial.value,
      },
      select: { id: true, status: true },
    });
    const draft = activity("SETTLEMENT_RECORDED", {
      settlementId: row.id,
      fromId: from,
      toId: to,
      amount: cents(input.amountCents),
      currency: scope.currency,
      method: input.method,
    });
    await tx.activityEvent.create({
      data: { groupId: input.groupId, actorId: you, type: draft.type, payload: draft.payload },
    });
    return row;
  });

  refreshGroup(input.groupId);
  runInBackground("payment recorded", () => notifySettlementRecorded(created.id));
  return actionOk<RecordedSettlement>({ id: created.id, status: created.status });
});

async function loadSettlement(id: string) {
  const row = await db.settlement.findUnique({
    where: { id },
    select: { id: true, groupId: true, fromId: true, toId: true, recordedById: true, status: true, autoConfirmAt: true, undoUntil: true },
  });
  if (!row || !row.groupId) return null;
  return { id: row.id, groupId: row.groupId, state: stateOf(row) };
}

type Transition = {
  readonly allowed: (state: SettlementState, actor: PersonId, now: Date) => boolean;
  readonly denied: string;
  readonly next: "CONFIRMED" | "CANCELLED";
  readonly update: "confirmed" | "declined" | "cancelled";
};

function transition({ allowed, denied, next, update }: Transition) {
  return defineAction(settlementRefSchema, async ({ settlementId }, { person }) => {
    const loaded = await loadSettlement(settlementId);
    if (!loaded) return actionFail("notFound", settlementMessages.gone);
    const now = new Date();
    if (!allowed(loaded.state, person.id, now)) return actionFail("conflict", denied);

    const draft =
      next === "CONFIRMED"
        ? activity("SETTLEMENT_CONFIRMED", { settlementId: loaded.id, auto: false })
        : activity("SETTLEMENT_CANCELLED", { settlementId: loaded.id });
    await db.$transaction(async (tx) => {
      await tx.settlement.update({
        where: { id: loaded.id },
        data: next === "CONFIRMED" ? { status: next, confirmedAt: now } : { status: next },
      });
      await tx.activityEvent.create({
        data: { groupId: loaded.groupId, actorId: person.id, type: draft.type, payload: draft.payload },
      });
    });

    refreshGroup(loaded.groupId);
    runInBackground("payment update", () => notifySettlementChanged(loaded.id, person.id, update));
    return actionOk<SettlementChange>({ id: loaded.id, groupId: loaded.groupId });
  });
}

export const confirmSettlement = transition({ allowed: canConfirm, denied: settlementMessages.cantConfirm, next: "CONFIRMED", update: "confirmed" });

export const declineSettlement = transition({ allowed: canDecline, denied: settlementMessages.cantDecline, next: "CANCELLED", update: "declined" });

export const undoSettlement = transition({ allowed: canUndo, denied: settlementMessages.cantUndo, next: "CANCELLED", update: "cancelled" });
