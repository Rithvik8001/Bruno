import "server-only";
import { toGroupRef } from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { isLastAdmin, type Membership } from "@/lib/domain/permissions";
import { balanceOf, balancesWith, inScope, netBalances } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { countsTowardBalance } from "@/lib/ledger/settlements";
import { cents } from "@/lib/money";
import { decideDelete, type BlockGroup, type DeleteFacts, type DeleteStatus, type MoneyAmount, type SettleTarget } from "./rules";

export interface AccountInspection {
  readonly status: DeleteStatus;
  readonly shared: readonly string[];
  readonly solo: readonly string[];
}

type MoneyBlock = NonNullable<DeleteFacts["money"]>;

const currencyOf = (value: string): CurrencyCode => (isCurrencyCode(value) ? value : DEFAULT_CURRENCY);

function sumByCurrency(amounts: readonly MoneyAmount[]): MoneyAmount[] {
  const totals = new Map<CurrencyCode, number>();
  for (const { currency, amount } of amounts) totals.set(currency, (totals.get(currency) ?? 0) + amount);
  return [...totals].map(([currency, amount]) => ({ currency, amount: cents(amount) }));
}

async function loadGroups(you: PersonId) {
  return db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tint: true,
      art: true,
      members: {
        where: { leftAt: null },
        select: { personId: true, role: true, leftAt: true, person: { select: { userId: true, deletedAt: true } } },
      },
    },
  });
}

type GroupRow = Awaited<ReturnType<typeof loadGroups>>[number];

async function moneyBlock(you: PersonId, groups: readonly GroupRow[], now: Date): Promise<MoneyBlock | null> {
  const ledger = await loadGroupLedgers(groups.map((group) => group.id));
  const rows: BlockGroup[] = groups.flatMap((group) => {
    const scope = toGroupId(group.id);
    const mine = balanceOf(netBalances(inScope(ledger.debts, scope), inScope(ledger.settlements, scope), now), you);
    const ref = toGroupRef(group);
    return [...mine]
      .filter(([, amount]) => amount !== 0)
      .map(([currency, amount]) => ({ id: group.id, name: ref.name, tint: ref.tint, art: ref.art, balance: { currency, amount } }));
  });
  if (rows.length === 0) return null;

  const counterparts = new Map<string, SettleTarget>();
  for (const group of groups) {
    const scope = toGroupId(group.id);
    const pairs = balancesWith(you, inScope(ledger.debts, scope), inScope(ledger.settlements, scope), now);
    for (const people of pairs.values()) {
      for (const [other, amount] of people) if (amount !== 0) counterparts.set(`${group.id}:${other}`, { groupId: group.id, personId: other });
    }
  }
  const [only] = [...counterparts.values()];

  return {
    kind: "money",
    owed: sumByCurrency(rows.filter((row) => row.balance.amount > 0).map((row) => row.balance)),
    owe: sumByCurrency(rows.filter((row) => row.balance.amount < 0).map((row) => ({ ...row.balance, amount: cents(-row.balance.amount) }))),
    groups: rows,
    settle: counterparts.size === 1 && only ? only : null,
  };
}

async function paymentBlock(you: PersonId, groupIds: readonly string[], now: Date): Promise<DeleteFacts["payment"]> {
  const rows = await db.settlement.findMany({
    where: { groupId: { in: [...groupIds] }, status: "PENDING", OR: [{ fromId: you }, { toId: you }] },
    orderBy: { createdAt: "asc" },
    select: {
      fromId: true,
      currency: true,
      amountCents: true,
      status: true,
      autoConfirmAt: true,
      from: { select: { displayName: true } },
      to: { select: { displayName: true } },
    },
  });
  const waiting = rows.find((row) => !countsTowardBalance(row, now));
  if (!waiting) return null;
  const sent = waiting.fromId === you;
  return {
    kind: "payment",
    direction: sent ? "sent" : "received",
    name: sent ? waiting.to.displayName : waiting.from.displayName,
    amount: { currency: currencyOf(waiting.currency), amount: cents(waiting.amountCents) },
  };
}

async function claimingBlock(you: PersonId, groupIds: readonly string[]): Promise<DeleteFacts["claiming"]> {
  const bill = await db.bill.findFirst({
    where: {
      groupId: { in: [...groupIds] },
      status: "CLAIMING",
      deletedAt: null,
      claimCode: { not: null },
      OR: [{ payerId: you }, { createdById: you }, { items: { some: { claims: { some: { personId: you } } } } }],
    },
    orderBy: { createdAt: "asc" },
    select: { title: true, claimCode: true },
  });
  return bill?.claimCode ? { kind: "claiming", title: bill.title, code: bill.claimCode } : null;
}

const hasAccount = (member: GroupRow["members"][number]) => member.person.userId !== null && member.person.deletedAt === null;

export async function inspectAccount(you: PersonId): Promise<AccountInspection> {
  const groups = await loadGroups(you);
  const ids = groups.map((group) => group.id);
  const now = new Date();
  const shared = groups.filter((group) => group.members.some((member) => member.personId !== you && hasAccount(member)));
  const sharedIds = new Set(shared.map((group) => group.id));

  const stuck = shared.find((group) => {
    const members: Membership[] = group.members.map((member) => ({
      groupId: toGroupId(group.id),
      personId: toPersonId(member.personId),
      role: member.role,
      leftAt: member.leftAt,
    }));
    return isLastAdmin(members, you);
  });

  const [payment, money, claiming] = await Promise.all([
    ids.length > 0 ? paymentBlock(you, ids, now) : null,
    ids.length > 0 ? moneyBlock(you, groups, now) : null,
    ids.length > 0 ? claimingBlock(you, ids) : null,
  ]);

  return {
    status: decideDelete({
      groups: groups.length,
      payment,
      money,
      claiming,
      admin: stuck ? { kind: "admin", groupId: stuck.id, name: stuck.name } : null,
    }),
    shared: [...sharedIds],
    solo: ids.filter((id) => !sharedIds.has(id)),
  };
}

export async function getDeleteStatus(you: PersonId): Promise<DeleteStatus> {
  return (await inspectAccount(you)).status;
}
