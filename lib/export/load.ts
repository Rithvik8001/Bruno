import "server-only";
import { toGroupRef } from "@/lib/bills/queries";
import { billSplitSelect } from "@/lib/bills/rows";
import { shiftDay } from "@/lib/calendar";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { billDay, localDay } from "@/lib/dates";
import { db } from "@/lib/db";
import type { PersonId } from "@/lib/domain/ids";
import { ALL_GROUPS, type DaySpan, type ExportCounts, type ExportGroup, type ExportKind } from "./rules";
import { peopleIn, type BillSource, type Names, type PaymentSource } from "./rows";

export interface ExportScopeGroup {
  readonly id: string;
  readonly name: string;
}

export interface ExportWindow {
  readonly span: DaySpan | null;
  readonly timeZone: string;
}

export interface ExportData {
  readonly bills: readonly BillSource[];
  readonly payments: readonly PaymentSource[];
  readonly names: Names;
}

const FINISHED = { deletedAt: null, status: "FINALIZED" } as const;

const memberOf = (you: PersonId) => ({ deletedAt: null, members: { some: { personId: you, leftAt: null } } });

const utcDay = (day: string) => new Date(`${day}T00:00:00.000Z`);

const currencyOf = (value: string): CurrencyCode => (isCurrencyCode(value) ? value : DEFAULT_CURRENCY);

const inSpan = (day: string, span: DaySpan | null) => span === null || (day >= span.from && day <= span.to);

function billWhere(ids: readonly string[], span: DaySpan | null) {
  return {
    groupId: { in: [...ids] },
    ...FINISHED,
    ...(span ? { occurredAt: { gte: utcDay(span.from), lt: utcDay(shiftDay(span.to, 1)) } } : {}),
  };
}

function paymentWhere(ids: readonly string[], span: DaySpan | null) {
  return {
    groupId: { in: [...ids] },
    ...(span ? { createdAt: { gte: utcDay(shiftDay(span.from, -1)), lt: utcDay(shiftDay(span.to, 2)) } } : {}),
  };
}

export async function exportGroups(you: PersonId): Promise<ExportGroup[]> {
  const groups = await db.group.findMany({
    where: memberOf(you),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tint: true,
      art: true,
      _count: { select: { members: { where: { leftAt: null } }, settlements: true } },
    },
  });
  if (groups.length === 0) return [];
  const bills = await db.bill.findMany({
    where: { groupId: { in: groups.map((group) => group.id) }, ...FINISHED },
    select: { groupId: true, _count: { select: { items: true } } },
  });
  const tally = new Map<string, { bills: number; items: number }>();
  for (const bill of bills) {
    if (!bill.groupId) continue;
    const entry = tally.get(bill.groupId) ?? { bills: 0, items: 0 };
    tally.set(bill.groupId, { bills: entry.bills + 1, items: entry.items + bill._count.items });
  }
  return groups.map((group) => {
    const ref = toGroupRef(group);
    const counted = tally.get(group.id) ?? { bills: 0, items: 0 };
    return {
      id: group.id,
      name: ref.name,
      tint: ref.tint,
      art: ref.art,
      people: group._count.members,
      counts: { bills: counted.bills, items: counted.items, payments: group._count.settlements },
    };
  });
}

export async function exportScope(you: PersonId, group: string): Promise<ExportScopeGroup[] | null> {
  if (group === ALL_GROUPS) {
    return db.group.findMany({ where: memberOf(you), orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
  }
  const found = await db.group.findFirst({ where: { id: group, ...memberOf(you) }, select: { id: true, name: true } });
  return found ? [found] : null;
}

export async function countExport(scope: readonly ExportScopeGroup[], window: ExportWindow): Promise<ExportCounts> {
  if (scope.length === 0) return { bills: 0, items: 0, payments: 0 };
  const ids = scope.map((group) => group.id);
  const where = billWhere(ids, window.span);
  const [bills, items, payments] = await Promise.all([
    db.bill.count({ where }),
    db.lineItem.count({ where: { bill: where } }),
    db.settlement.findMany({ where: paymentWhere(ids, window.span), select: { createdAt: true } }),
  ]);
  return {
    bills,
    items,
    payments: payments.filter((payment) => inSpan(localDay(window.timeZone, payment.createdAt), window.span)).length,
  };
}

async function loadBills(scope: readonly ExportScopeGroup[], window: ExportWindow): Promise<BillSource[]> {
  const groupNames = new Map(scope.map((group) => [group.id, group.name]));
  const rows = await db.bill.findMany({
    where: billWhere([...groupNames.keys()], window.span),
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
    select: {
      title: true,
      occurredAt: true,
      groupId: true,
      currency: true,
      payerId: true,
      createdById: true,
      totalCents: true,
      ...billSplitSelect,
      items: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, quantity: true, category: true, priceCents: true, claims: { select: { personId: true } } },
      },
    },
  });
  return rows.map(({ occurredAt, groupId, currency, ...row }) => ({
    ...row,
    day: billDay(occurredAt),
    group: (groupId && groupNames.get(groupId)) || "",
    currency: currencyOf(currency),
  }));
}

async function loadPayments(scope: readonly ExportScopeGroup[], window: ExportWindow): Promise<PaymentSource[]> {
  const groupNames = new Map(scope.map((group) => [group.id, group.name]));
  const rows = await db.settlement.findMany({
    where: paymentWhere([...groupNames.keys()], window.span),
    orderBy: { createdAt: "asc" },
    select: {
      groupId: true,
      fromId: true,
      toId: true,
      recordedById: true,
      currency: true,
      amountCents: true,
      note: true,
      status: true,
      autoConfirmAt: true,
      createdAt: true,
    },
  });
  return rows.flatMap(({ createdAt, groupId, currency, ...row }) => {
    const day = localDay(window.timeZone, createdAt);
    if (!inSpan(day, window.span)) return [];
    return [{ ...row, day, group: (groupId && groupNames.get(groupId)) || "", currency: currencyOf(currency) }];
  });
}

export async function loadExport(
  scope: readonly ExportScopeGroup[],
  window: ExportWindow,
  kinds: readonly ExportKind[],
): Promise<ExportData> {
  const wantsBills = kinds.includes("bills") || kinds.includes("items");
  const [bills, payments] = await Promise.all([
    wantsBills ? loadBills(scope, window) : [],
    kinds.includes("payments") ? loadPayments(scope, window) : [],
  ]);
  const ids = peopleIn(bills, payments);
  const people = ids.length === 0 ? [] : await db.person.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } });
  return { bills, payments, names: new Map(people.map((person) => [person.id, person.displayName])) };
}
