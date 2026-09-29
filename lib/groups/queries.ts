import "server-only";
import {
  ledgerView,
  loadPeople,
  summarizeBills,
  toGroupRef,
  type BillSummary,
  type LedgerView,
} from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { isGroupArtId, type GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { db } from "@/lib/db";
import { groupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import type { GroupRole, Membership } from "@/lib/domain/permissions";
import { debtKey } from "@/lib/ledger/allocation";
import { balanceOf, inScope, netBalances } from "@/lib/ledger/balances";
import { loadGroupLedgers, type Ledger } from "@/lib/ledger/load";
import { minimumPayments, type Payment } from "@/lib/ledger/settle-up";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { parseTint } from "@/lib/people/defaults";
import { listGroupSettlements } from "@/lib/settlements/queries";
import type { SettlementCard } from "@/lib/settlements/rows";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";

const PREVIEW_MEMBERS = 4;
const CAPTION_TITLES = 2;

export interface GroupMemberView {
  readonly person: PersonView;
  readonly role: GroupRole;
  readonly joinedAt: Date;
}

export interface GroupSummary {
  readonly id: GroupId;
  readonly slug: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly currency: CurrencyCode;
  readonly memberCount: number;
  readonly members: readonly PersonView[];
  readonly openBills: number;
  readonly yourBalance: Cents;
}

export interface MemberBalance {
  readonly person: PersonView;
  readonly net: Cents;
  readonly paid: number;
  readonly involved: number;
  readonly openTitles: readonly string[];
}

export interface GroupDetail extends GroupSummary {
  readonly roster: readonly GroupMemberView[];
  readonly you: Membership;
  readonly billCount: number;
  readonly spent: Cents;
  readonly yourShare: Cents;
  readonly everyoneSquare: boolean;
  readonly bills: readonly BillSummary[];
  readonly balances: readonly MemberBalance[];
  readonly payments: readonly Payment[];
  readonly settlements: readonly SettlementCard[];
}

export interface BillComposer {
  readonly id: GroupId;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly currency: CurrencyCode;
  readonly members: readonly PersonView[];
}

export interface GroupInvite {
  readonly id: GroupId;
  readonly slug: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly memberCount: number;
  readonly members: readonly PersonView[];
  readonly invitedBy: string | null;
}

const activeMembers = {
  where: { leftAt: null },
  orderBy: { joinedAt: "asc" },
  select: { role: true, joinedAt: true, leftAt: true, person: { select: personSelect } },
} as const;

const groupSelect = {
  id: true,
  slug: true,
  name: true,
  tint: true,
  art: true,
  currency: true,
  members: activeMembers,
} as const;

type GroupRow = {
  id: string;
  slug: string;
  name: string;
  tint: string;
  art: string | null;
  currency: string;
  members: readonly { role: GroupRole; joinedAt: Date; leftAt: Date | null; person: Parameters<typeof toPersonView>[0] }[];
};

function balancesIn(ledger: Ledger, id: GroupId, now: Date) {
  return netBalances(inScope(ledger.debts, id), inScope(ledger.settlements, id), now);
}

function openBillCount(ledger: Ledger, view: LedgerView, id: GroupId): number {
  return inScope(ledger.bills, id).filter((b) => (view.outstanding.get(b.billId) ?? ZERO_CENTS) > 0).length;
}

function toSummary(row: GroupRow, you: PersonId, ledger: Ledger, view: LedgerView, now: Date): GroupSummary {
  const id = groupId(row.id);
  const currency = isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY;
  const people = row.members.map((m) => toPersonView(m.person));
  return {
    id,
    slug: row.slug,
    name: row.name,
    tint: parseTint(row.tint, row.name),
    art: row.art !== null && isGroupArtId(row.art) ? row.art : null,
    currency,
    memberCount: people.length,
    members: people.slice(0, PREVIEW_MEMBERS),
    openBills: openBillCount(ledger, view, id),
    yourBalance: balanceOf(balancesIn(ledger, id, now), you).get(currency) ?? ZERO_CENTS,
  };
}

export async function listGroupsFor(you: PersonId): Promise<GroupSummary[]> {
  const rows = await db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    orderBy: { updatedAt: "desc" },
    select: groupSelect,
  });
  const ledger = await loadGroupLedgers(rows.map((r) => r.id));
  const now = new Date();
  const view = ledgerView(ledger, now);
  return rows.map((row) => toSummary(row, you, ledger, view, now));
}

function memberBalances(
  roster: readonly PersonView[],
  ledger: Ledger,
  view: LedgerView,
  net: ReadonlyMap<PersonId, Cents>,
  scope: GroupId,
  currency: CurrencyCode,
): MemberBalance[] {
  const bills = inScope(ledger.bills, scope).filter((b) => b.currency === currency);
  const titleOf = new Map(bills.map((b) => [b.billId, b.title]));
  const debts = inScope(ledger.debts, scope).filter((d) => d.currency === currency);
  const open = debts.filter((d) => (view.remaining.get(debtKey(d)) ?? ZERO_CENTS) > 0);
  return roster
    .map((person) => {
      const balance = net.get(person.id) ?? ZERO_CENTS;
      const related = balance < 0 ? open.filter((d) => d.from === person.id) : open.filter((d) => d.to === person.id);
      return {
        person,
        net: balance,
        paid: bills.filter((b) => b.payerId === person.id).length,
        involved: bills.filter((b) => b.payerId === person.id || (b.shares.get(person.id) ?? 0) > 0).length,
        openTitles: [...new Set(related.map((d) => titleOf.get(d.billId) ?? ""))].filter(Boolean).slice(0, CAPTION_TITLES),
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

export async function getGroupForMember(id: string, you: PersonId): Promise<GroupDetail | null> {
  const row = await db.group.findFirst({
    where: { id, deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    select: groupSelect,
  });
  if (!row) return null;
  const mine = row.members.find((m) => m.person.id === you);
  if (!mine) return null;
  const [ledger, billCount] = await Promise.all([
    loadGroupLedgers([row.id]),
    db.bill.count({ where: { groupId: row.id, deletedAt: null } }),
  ]);
  const now = new Date();
  const view = ledgerView(ledger, now);
  const summary = toSummary(row, you, ledger, view, now);
  const roster = row.members.map((m) => ({ person: toPersonView(m.person), role: m.role, joinedAt: m.joinedAt }));
  const entries = inScope(ledger.bills, summary.id);
  const bills = entries.filter((b) => b.currency === summary.currency);
  const net = balancesIn(ledger, summary.id, now).get(summary.currency) ?? new Map<PersonId, Cents>();
  const [people, settlements] = await Promise.all([
    loadPeople(entries.map((b) => b.payerId)),
    listGroupSettlements(summary.id, you),
  ]);
  const groupRef = toGroupRef(row);

  return {
    ...summary,
    roster,
    you: { groupId: summary.id, personId: you, role: mine.role, leftAt: mine.leftAt },
    billCount,
    spent: sumCents(bills.map((b) => b.total)),
    yourShare: sumCents(bills.map((b) => b.shares.get(you) ?? cents(0))),
    everyoneSquare: [...net.values()].every((v) => v === 0),
    bills: summarizeBills(entries, view, people, new Map([[groupRef.id, groupRef]]), you, now),
    balances: memberBalances(
      roster.map((m) => m.person),
      ledger,
      view,
      net,
      summary.id,
      summary.currency,
    ),
    payments: minimumPayments(net),
    settlements,
  };
}

export async function getGroupInvite(slug: string): Promise<GroupInvite | null> {
  const row = await db.group.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      tint: true,
      art: true,
      members: activeMembers,
      createdBy: { select: { displayName: true } },
    },
  });
  if (!row) return null;
  const people = row.members.map((m) => toPersonView(m.person));
  return {
    id: groupId(row.id),
    slug: row.slug,
    name: row.name,
    tint: parseTint(row.tint, row.name),
    art: row.art !== null && isGroupArtId(row.art) ? row.art : null,
    memberCount: people.length,
    members: people.slice(0, PREVIEW_MEMBERS),
    invitedBy: row.createdBy.displayName,
  };
}

export async function getBillComposer(id: string, you: PersonId): Promise<BillComposer | null> {
  const row = await db.group.findFirst({
    where: { id, deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    select: { id: true, name: true, tint: true, art: true, currency: true, members: activeMembers },
  });
  if (!row) return null;
  return {
    id: groupId(row.id),
    name: row.name,
    tint: parseTint(row.tint, row.name),
    art: row.art !== null && isGroupArtId(row.art) ? row.art : null,
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
    members: row.members.map((m) => toPersonView(m.person)),
  };
}

export async function isActiveMemberOf(id: string, you: PersonId): Promise<boolean> {
  const membership = await db.groupMember.findFirst({ where: { groupId: id, personId: you, leftAt: null }, select: { id: true } });
  return membership !== null;
}
