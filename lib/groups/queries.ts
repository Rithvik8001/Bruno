import "server-only";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { isGroupArtId, type GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { db } from "@/lib/db";
import { groupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import type { GroupRole, Membership } from "@/lib/domain/permissions";
import { balanceOf, inScope, netBalances } from "@/lib/ledger/balances";
import { loadGroupLedgers, type Ledger } from "@/lib/ledger/load";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { parseTint } from "@/lib/people/defaults";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";

const PREVIEW_MEMBERS = 4;

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

export interface GroupDetail extends GroupSummary {
  readonly roster: readonly GroupMemberView[];
  readonly you: Membership;
  readonly billCount: number;
  readonly spent: Cents;
  readonly yourShare: Cents;
  readonly everyoneSquare: boolean;
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
  _count: { select: { bills: { where: { deletedAt: null, status: { not: "FINALIZED" } } } } },
} as const;

type GroupRow = {
  id: string;
  slug: string;
  name: string;
  tint: string;
  art: string | null;
  currency: string;
  members: readonly { role: GroupRole; joinedAt: Date; leftAt: Date | null; person: Parameters<typeof toPersonView>[0] }[];
  _count: { bills: number };
};

function balancesIn(ledger: Ledger, id: GroupId, now: Date) {
  return netBalances(inScope(ledger.debts, id), inScope(ledger.settlements, id), now);
}

function toSummary(row: GroupRow, you: PersonId, ledger: Ledger, now: Date): GroupSummary {
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
    openBills: row._count.bills,
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
  return rows.map((row) => toSummary(row, you, ledger, now));
}

export async function getGroupForMember(id: string, you: PersonId): Promise<GroupDetail | null> {
  const row = await db.group.findFirst({
    where: { id, deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    select: groupSelect,
  });
  if (!row) return null;
  const [ledger, billCount] = await Promise.all([
    loadGroupLedgers([row.id]),
    db.bill.count({ where: { groupId: row.id, deletedAt: null } }),
  ]);
  const now = new Date();
  const summary = toSummary(row, you, ledger, now);
  const roster = row.members.map((m) => ({ person: toPersonView(m.person), role: m.role, joinedAt: m.joinedAt }));
  const mine = row.members.find((m) => m.person.id === you);
  if (!mine) return null;
  const bills = inScope(ledger.bills, summary.id).filter((b) => b.currency === summary.currency);
  const balances = balancesIn(ledger, summary.id, now).get(summary.currency);
  return {
    ...summary,
    roster,
    you: { groupId: summary.id, personId: you, role: mine.role, leftAt: mine.leftAt },
    billCount,
    spent: sumCents(bills.map((b) => b.total)),
    yourShare: sumCents(bills.map((b) => b.shares.get(you) ?? cents(0))),
    everyoneSquare: [...(balances?.values() ?? [])].every((v) => v === 0),
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

export async function isActiveMemberOf(id: string, you: PersonId): Promise<boolean> {
  const membership = await db.groupMember.findFirst({ where: { groupId: id, personId: you, leftAt: null }, select: { id: true } });
  return membership !== null;
}
