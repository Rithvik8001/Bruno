import "server-only";
import { parseActivityPayload } from "@/lib/activity";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { isGroupArtId, type GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { billId, groupId, lineItemId, personId, type BillId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { canEditBill } from "@/lib/domain/permissions";
import type { BillComposer } from "@/lib/groups/queries";
import {
  debtKey,
  outstandingByBill,
  personBillStatus,
  remainingByDebt,
  type DebtKey,
  type PersonBillStatus,
} from "@/lib/ledger/allocation";
import type { Debt } from "@/lib/ledger/balances";
import { loadGroupLedgers, type BillTotalsEntry, type Ledger } from "@/lib/ledger/load";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { parseTint } from "@/lib/people/defaults";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { isBillChangeField, type BillChangeField } from "./diff";
import type { ClaimedItem } from "./messages";
import { billInputFromRow, billSplitSelect } from "./rows";
import type { CreateBillValues } from "./schema";
import { computeShares } from "./split";
import { displayStatus, type BillDisplayStatus } from "./status";
import type { BillTotals, PersonShare, SplitMethod } from "./types";

export interface BillGroupRef {
  readonly id: GroupId;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
}

export interface BillSummary {
  readonly id: BillId;
  readonly slug: string;
  readonly title: string;
  readonly occurredAt: Date;
  readonly currency: CurrencyCode;
  readonly total: Cents;
  readonly payer: PersonView;
  readonly group: BillGroupRef;
  readonly status: BillDisplayStatus;
  readonly yourShare: Cents;
  readonly yourBalance: Cents;
  readonly owingCount: number;
  readonly claiming: ClaimProgress | null;
}

export interface ClaimProgress {
  readonly code: string;
  readonly claimed: number;
  readonly items: number;
}

export interface LedgerView {
  readonly remaining: ReadonlyMap<DebtKey, Cents>;
  readonly outstanding: ReadonlyMap<BillId, Cents>;
  readonly debtsByBill: ReadonlyMap<BillId, readonly Debt[]>;
}

export function ledgerView(ledger: Ledger, now: Date): LedgerView {
  const remaining = remainingByDebt(ledger.debts, ledger.settlements, now);
  const debtsByBill = new Map<BillId, Debt[]>();
  for (const debt of ledger.debts) debtsByBill.set(debt.billId, [...(debtsByBill.get(debt.billId) ?? []), debt]);
  return { remaining, outstanding: outstandingByBill(ledger.debts, remaining), debtsByBill };
}

export function toGroupRef(row: { id: string; name: string; tint: string; art: string | null }): BillGroupRef {
  return {
    id: groupId(row.id),
    name: row.name,
    tint: parseTint(row.tint, row.name),
    art: row.art !== null && isGroupArtId(row.art) ? row.art : null,
  };
}

export async function loadPeople(ids: Iterable<string>): Promise<ReadonlyMap<PersonId, PersonView>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db.person.findMany({ where: { id: { in: unique } }, select: personSelect });
  return new Map(rows.map((row) => [personId(row.id), toPersonView(row)]));
}

export function billStatusOf(entry: BillTotalsEntry, view: LedgerView, now: Date): BillDisplayStatus {
  return displayStatus(
    { status: "FINALIZED", finalizedAt: entry.finalizedAt, outstanding: view.outstanding.get(entry.billId) ?? ZERO_CENTS },
    now,
  );
}

export function yourBalanceOn(entry: BillTotalsEntry, view: LedgerView, you: PersonId): Cents {
  const debts = view.debtsByBill.get(entry.billId) ?? [];
  const left = (d: Debt) => view.remaining.get(debtKey(d)) ?? ZERO_CENTS;
  if (entry.payerId === you) return sumCents(debts.map(left));
  const mine = debts.find((d) => d.from === you);
  return mine ? cents(-left(mine)) : ZERO_CENTS;
}

export function summarizeBills(
  entries: readonly BillTotalsEntry[],
  view: LedgerView,
  people: ReadonlyMap<PersonId, PersonView>,
  groups: ReadonlyMap<GroupId, BillGroupRef>,
  you: PersonId,
  now: Date,
): BillSummary[] {
  return entries.flatMap((entry) => {
    const payer = people.get(entry.payerId);
    const group = entry.groupId ? groups.get(entry.groupId) : undefined;
    if (!payer || !group) return [];
    const debts = view.debtsByBill.get(entry.billId) ?? [];
    return [
      {
        id: entry.billId,
        slug: entry.slug,
        title: entry.title,
        occurredAt: entry.occurredAt,
        currency: entry.currency,
        total: entry.total,
        payer,
        group,
        status: billStatusOf(entry, view, now),
        yourShare: entry.shares.get(you) ?? ZERO_CENTS,
        yourBalance: yourBalanceOn(entry, view, you),
        owingCount: debts.filter((d) => (view.remaining.get(debtKey(d)) ?? ZERO_CENTS) > 0).length,
        claiming: null,
      },
    ];
  });
}

export async function claimingBills(groupIds: readonly string[]): Promise<BillSummary[]> {
  if (groupIds.length === 0) return [];
  const rows = await db.bill.findMany({
    where: { groupId: { in: [...groupIds] }, deletedAt: null, status: "CLAIMING", group: { deletedAt: null } },
    orderBy: { occurredAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      occurredAt: true,
      currency: true,
      totalCents: true,
      claimCode: true,
      payer: { select: personSelect },
      group: { select: { id: true, name: true, tint: true, art: true } },
      items: { where: { priceCents: { gt: 0 } }, select: { _count: { select: { claims: true } } } },
    },
  });
  return rows.flatMap((row) =>
    row.claimCode && row.group
      ? [
          {
            id: billId(row.id),
            slug: row.slug,
            title: row.title,
            occurredAt: row.occurredAt,
            currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
            total: cents(row.totalCents),
            payer: toPersonView(row.payer),
            group: toGroupRef(row.group),
            status: "claiming",
            yourShare: ZERO_CENTS,
            yourBalance: ZERO_CENTS,
            owingCount: 0,
            claiming: {
              code: row.claimCode,
              claimed: row.items.filter((item) => item._count.claims > 0).length,
              items: row.items.length,
            },
          },
        ]
      : [],
  );
}

export interface BillLineShare {
  readonly name: string;
  readonly quantity: number;
  readonly amount: Cents;
  readonly sharedWith: readonly PersonId[];
}

export type ShareBasis =
  | { readonly kind: "items"; readonly lines: readonly BillLineShare[] }
  | { readonly kind: "even"; readonly ways: number }
  | { readonly kind: "shares"; readonly shares: number; readonly of: number }
  | { readonly kind: "percent"; readonly bps: number }
  | { readonly kind: "amount" };

export interface BillPersonRow {
  readonly person: PersonView;
  readonly share: PersonShare | null;
  readonly status: PersonBillStatus;
  readonly basis: ShareBasis | null;
}

export interface BillItemRow {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents;
  readonly claimants: readonly PersonView[];
}

export interface BillCharges extends BillTotals {
  readonly tipBps: number | null;
}

export type BillEvent =
  | { readonly kind: "created"; readonly itemCount: number }
  | { readonly kind: "updated"; readonly fields: readonly BillChangeField[] }
  | { readonly kind: "finalized" }
  | { readonly kind: "claimingOpened"; readonly reopened: boolean }
  | { readonly kind: "claimed"; readonly items: readonly ClaimedItem[] }
  | { readonly kind: "reminded"; readonly count: number }
  | { readonly kind: "joined" };


export interface BillActivityRow {
  readonly id: string;
  readonly actor: PersonView | null;
  readonly at: Date;
  readonly event: BillEvent;
}

export interface BillDetail {
  readonly id: BillId;
  readonly slug: string;
  readonly title: string;
  readonly occurredAt: Date;
  readonly currency: CurrencyCode;
  readonly method: SplitMethod;
  readonly group: BillGroupRef;
  readonly payer: PersonView;
  readonly status: BillDisplayStatus;
  readonly owingCount: number;
  readonly canEdit: boolean;
  readonly canReopen: boolean;
  readonly people: readonly BillPersonRow[];
  readonly items: readonly BillItemRow[];
  readonly charges: BillCharges;
  readonly activity: readonly BillActivityRow[];
}

const memberOf = (you: PersonId) => ({
  is: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
});

function toEvent(type: string, payload: unknown): BillEvent | null {
  switch (type) {
    case "BILL_CREATED": {
      const p = parseActivityPayload("BILL_CREATED", payload);
      return p ? { kind: "created", itemCount: p.itemCount } : null;
    }
    case "BILL_UPDATED": {
      const p = parseActivityPayload("BILL_UPDATED", payload);
      return p ? { kind: "updated", fields: p.fields.filter(isBillChangeField) } : null;
    }
    case "BILL_FINALIZED":
      return { kind: "finalized" };
    case "BILL_CLAIMING_OPENED": {
      const p = parseActivityPayload("BILL_CLAIMING_OPENED", payload);
      return p ? { kind: "claimingOpened", reopened: p.reopened } : null;
    }
    case "BILL_CLAIMED": {
      const p = parseActivityPayload("BILL_CLAIMED", payload);
      return p && p.items.length > 0 ? { kind: "claimed", items: p.items } : null;
    }
    case "CLAIMS_REMINDED": {
      const p = parseActivityPayload("CLAIMS_REMINDED", payload);
      return p ? { kind: "reminded", count: p.personIds.length } : null;
    }
    case "MEMBER_JOINED":
      return { kind: "joined" };
    default:
      return null;
  }
}

function basisFor(
  method: SplitMethod,
  person: PersonId,
  share: PersonShare,
  participants: readonly { personId: string; shares: number; percentBps: number | null }[],
  items: readonly BillItemRow[],
): ShareBasis {
  switch (method) {
    case "ITEMS":
      return {
        kind: "items",
        lines: share.lines.flatMap((line) => {
          const item = items.find((i) => i.id === line.lineItemId);
          if (!item) return [];
          return [
            {
              name: item.name,
              quantity: item.quantity,
              amount: line.amount,
              sharedWith: item.claimants.map((c) => c.id).filter((id) => id !== person),
            },
          ];
        }),
      };
    case "EVEN":
      return { kind: "even", ways: participants.length };
    case "SHARES":
      return {
        kind: "shares",
        shares: participants.find((p) => p.personId === person)?.shares ?? 0,
        of: participants.reduce((sum, p) => sum + p.shares, 0),
      };
    case "PERCENT":
      return { kind: "percent", bps: participants.find((p) => p.personId === person)?.percentBps ?? 0 };
    case "AMOUNT":
      return { kind: "amount" };
  }
}

export async function getBillDetail(slug: string, you: PersonId): Promise<BillDetail | null> {
  const row = await db.bill.findFirst({
    where: { slug, deletedAt: null, status: "FINALIZED", group: memberOf(you) },
    select: {
      id: true,
      slug: true,
      title: true,
      occurredAt: true,
      finalizedAt: true,
      currency: true,
      status: true,
      createdById: true,
      deletedAt: true,
      groupId: true,
      payer: { select: personSelect },
      group: {
        select: {
          id: true,
          name: true,
          tint: true,
          art: true,
          members: { where: { personId: you }, select: { role: true, leftAt: true } },
        },
      },
      ...billSplitSelect,
      items: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, quantity: true, priceCents: true, claims: { select: { personId: true, person: { select: personSelect } } } },
      },
      participants: {
        select: { personId: true, shares: true, percentBps: true, amountCents: true, person: { select: personSelect } },
      },
      activity: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, type: true, payload: true, createdAt: true, actor: { select: personSelect } },
      },
    },
  });
  if (!row || !row.group || !row.groupId) return null;
  const split = computeShares(billInputFromRow(row));
  if (!split.ok) return null;

  const now = new Date();
  const ledger = await loadGroupLedgers([row.groupId]);
  const view = ledgerView(ledger, now);
  const id = billId(row.id);
  const entry = ledger.bills.find((b) => b.billId === id);
  const currency = isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY;
  const payer = toPersonView(row.payer);
  const group = toGroupRef(row.group);
  const membership = row.group.members[0];

  const people = new Map<PersonId, PersonView>([[payer.id, payer]]);
  for (const item of row.items) for (const claim of item.claims) people.set(personId(claim.personId), toPersonView(claim.person));
  for (const p of row.participants) people.set(personId(p.personId), toPersonView(p.person));

  const items: BillItemRow[] = row.items.map((item) => ({
    id: lineItemId(item.id),
    name: item.name,
    quantity: item.quantity,
    price: cents(item.priceCents),
    claimants: item.claims.map((c) => toPersonView(c.person)),
  }));

  const shares = split.value.shares;
  const totals = { id, payerId: payer.id, shares: new Map([...shares].map(([k, v]) => [k, v.total])) };
  const rank = (p: PersonView) => (p.id === payer.id ? 0 : p.id === you ? 1 : 2);
  const personRows: BillPersonRow[] = [...people.values()]
    .sort((a, b) => rank(a) - rank(b) || (shares.get(b.id)?.total ?? 0) - (shares.get(a.id)?.total ?? 0))
    .map((person) => {
      const share = shares.get(person.id) ?? null;
      return {
        person,
        share,
        status: personBillStatus(person.id, totals, view.remaining),
        basis: share ? basisFor(row.splitMethod, person.id, share, row.participants, items) : null,
      };
    });

  const debts = view.debtsByBill.get(id) ?? [];
  const canEdit = canEditBill(
    you,
    { groupId: group.id, createdById: personId(row.createdById), status: row.status, deletedAt: row.deletedAt },
    membership ? { groupId: group.id, personId: you, role: membership.role, leftAt: membership.leftAt } : null,
  );
  return {
    id,
    slug: row.slug,
    title: row.title,
    occurredAt: row.occurredAt,
    currency,
    method: row.splitMethod,
    group,
    payer,
    status: entry ? billStatusOf(entry, view, now) : "ready",
    owingCount: debts.filter((d) => (view.remaining.get(debtKey(d)) ?? ZERO_CENTS) > 0).length,
    canEdit,
    canReopen: canEdit && row.splitMethod === "ITEMS",
    people: personRows,
    items,
    charges: { ...split.value.totals, tipBps: row.tipKind === "PERCENT" ? row.tipValue : null },
    activity: row.activity.flatMap((event) => {
      const parsed = toEvent(event.type, event.payload);
      return parsed ? [{ id: event.id, actor: event.actor ? toPersonView(event.actor) : null, at: event.createdAt, event: parsed }] : [];
    }),
  };
}

export interface EditableBill {
  readonly billId: BillId;
  readonly slug: string;
  readonly claimCode: string | null;
  readonly claiming: boolean;
  readonly canEdit: boolean;
  readonly composer: BillComposer;
  readonly values: CreateBillValues;
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export async function getEditableBill(slug: string, you: PersonId): Promise<EditableBill | null> {
  const row = await db.bill.findFirst({
    where: { slug, deletedAt: null, status: { in: ["FINALIZED", "CLAIMING"] }, group: memberOf(you) },
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
      groupId: true,
      splitMethod: true,
      taxCents: true,
      tipKind: true,
      tipValue: true,
      discountCents: true,
      items: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, quantity: true, priceCents: true, claims: { select: { personId: true } } },
      },
      participants: { select: { personId: true, shares: true, percentBps: true, amountCents: true } },
      group: {
        select: {
          id: true,
          name: true,
          tint: true,
          art: true,
          currency: true,
          members: { where: { leftAt: null }, orderBy: { joinedAt: "asc" }, select: { role: true, personId: true, person: { select: personSelect } } },
        },
      },
    },
  });
  if (!row || !row.group || !row.groupId) return null;

  const onBill = [
    row.payerId,
    ...row.items.flatMap((item) => item.claims.map((c) => c.personId)),
    ...row.participants.map((p) => p.personId),
  ];
  const active = row.group.members.map((m) => toPersonView(m.person));
  const activeIds = new Set<string>(active.map((m) => m.id));
  const former = await loadPeople(onBill.filter((pid) => !activeIds.has(pid)));
  const me = row.group.members.find((m) => m.personId === you);
  const gid = groupId(row.group.id);
  const tip: CreateBillValues["tip"] =
    row.tipKind === "PERCENT"
      ? { kind: "PERCENT", bps: row.tipValue }
      : row.tipKind === "AMOUNT"
        ? { kind: "AMOUNT", cents: row.tipValue }
        : { kind: "NONE" };

  return {
    billId: billId(row.id),
    slug: row.slug,
    claimCode: row.claimCode,
    claiming: row.status === "CLAIMING",
    canEdit: canEditBill(
      you,
      { groupId: gid, createdById: personId(row.createdById), status: row.status, deletedAt: row.deletedAt },
      me ? { groupId: gid, personId: you, role: me.role, leftAt: null } : null,
    ),
    composer: {
      id: gid,
      name: row.group.name,
      tint: parseTint(row.group.tint, row.group.name),
      art: row.group.art !== null && isGroupArtId(row.group.art) ? row.group.art : null,
      currency: isCurrencyCode(row.group.currency) ? row.group.currency : DEFAULT_CURRENCY,
      members: [...active, ...former.values()],
    },
    values: {
      groupId: gid,
      title: row.title,
      occurredOn: isoDay(row.occurredAt),
      payerId: row.payerId,
      items: row.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
        claimedBy: item.claims.map((c) => c.personId),
      })),
      taxCents: row.taxCents,
      tip,
      discountCents: row.discountCents,
      method: row.splitMethod,
      participants: row.participants.map((p) => ({ ...p })),
    },
  };
}

export async function claimCodeFor(slug: string, you: PersonId): Promise<string | null> {
  const row = await db.bill.findFirst({
    where: { slug, deletedAt: null, status: "CLAIMING", group: memberOf(you) },
    select: { claimCode: true },
  });
  return row?.claimCode ?? null;
}
