import "server-only";
import { ledgerView, toGroupRef, type BillGroupRef } from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId, personId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { loadGroupLedgers } from "@/lib/ledger/load";
import {
  openAmount,
  openLines,
  pairBalance,
  pendingBetween,
  settleRole,
  type OpenLine,
  type SettleRole,
} from "@/lib/ledger/pair";
import type { Cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { settlementSelect, toSettlementCard, type SettlementCard } from "./rows";

const RECENT_PAYMENTS = 10;

export interface SettleGroup extends BillGroupRef {
  readonly currency: CurrencyCode;
}

export interface SettleUpView {
  readonly group: SettleGroup;
  readonly you: PersonView;
  readonly them: PersonView;
  readonly role: SettleRole;
  readonly balance: Cents;
  readonly openAmount: Cents;
  readonly breakdown: readonly OpenLine[];
  readonly pending: SettlementCard | null;
  readonly lastRecorded: SettlementCard | null;
}

const activeGroup = (you: PersonId) => ({ deletedAt: null, members: { some: { personId: you, leftAt: null } } });

export async function getSettleUp(groupKey: string, otherId: string, you: PersonId): Promise<SettleUpView | null> {
  if (otherId === you) return null;
  const group = await db.group.findFirst({
    where: { id: groupKey, ...activeGroup(you) },
    select: {
      id: true,
      name: true,
      tint: true,
      art: true,
      currency: true,
      members: { where: { personId: { in: [you, otherId] } }, select: { personId: true, person: { select: personSelect } } },
    },
  });
  const me = group?.members.find((m) => m.personId === you);
  const other = group?.members.find((m) => m.personId === otherId);
  if (!group || !me || !other) return null;

  const now = new Date();
  const currency = isCurrencyCode(group.currency) ? group.currency : DEFAULT_CURRENCY;
  const ref = toGroupRef(group);
  const scope = { groupId: ref.id, currency };
  const them = personId(otherId);
  const [ledger, rows] = await Promise.all([
    loadGroupLedgers([group.id]),
    db.settlement.findMany({
      where: {
        groupId: group.id,
        status: { not: "CANCELLED" },
        OR: [
          { fromId: you, toId: otherId },
          { fromId: otherId, toId: you },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: RECENT_PAYMENTS,
      select: settlementSelect,
    }),
  ]);
  const view = ledgerView(ledger, now);
  const balance = pairBalance(you, them, ledger.debts, ledger.settlements, scope, now);
  const pendingToMe = pendingBetween(ledger.settlements, them, you, scope, now);
  const pendingFromMe = pendingBetween(ledger.settlements, you, them, scope, now);
  const role = settleRole({ balance, pendingToMe, pendingFromMe });
  const titles = new Map(ledger.bills.map((b) => [b.billId, b.title]));
  const cards = rows.map((row) => toSettlementCard(row, you, now));

  return {
    group: { ...ref, currency },
    you: toPersonView(me.person),
    them: toPersonView(other.person),
    role,
    balance,
    openAmount: openAmount(role, balance, pendingFromMe),
    breakdown:
      balance >= 0
        ? openLines(ledger.debts, view.remaining, titles, them, you, scope)
        : openLines(ledger.debts, view.remaining, titles, you, them, scope),
    pending:
      role === "confirm"
        ? (cards.find((c) => c.actions.confirm) ?? null)
        : role === "awaiting"
          ? (cards.find((c) => c.from.id === you && c.status === "PENDING" && !c.counts) ?? null)
          : null,
    lastRecorded: cards.find((c) => c.recordedBy === you && c.actions.undo) ?? null,
  };
}

export async function listGroupSettlements(scope: GroupId, you: PersonId): Promise<SettlementCard[]> {
  const rows = await db.settlement.findMany({
    where: { groupId: scope, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    take: RECENT_PAYMENTS,
    select: settlementSelect,
  });
  const now = new Date();
  return rows.map((row) => toSettlementCard(row, you, now));
}

export interface PendingForYou {
  readonly card: SettlementCard;
  readonly groupId: GroupId;
}

export async function pendingForYou(you: PersonId): Promise<PendingForYou[]> {
  const now = new Date();
  const rows = await db.settlement.findMany({
    where: { toId: you, status: "PENDING", autoConfirmAt: { gt: now }, group: { is: activeGroup(you) } },
    orderBy: { createdAt: "desc" },
    select: settlementSelect,
  });
  return rows.flatMap((row) =>
    row.groupId ? [{ card: toSettlementCard(row, you, now), groupId: groupId(row.groupId) }] : [],
  );
}
