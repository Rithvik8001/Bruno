import "server-only";
import { toGroupRef, type BillGroupRef } from "@/lib/bills/queries";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId, type PersonId } from "@/lib/domain/ids";
import { inScope, netBalances } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { minimumPayments } from "@/lib/ledger/settle-up";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { parseBuddy, parseTint } from "@/lib/people/defaults";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { hashGuestToken } from "./guest-token";
import type { LookupQuery } from "./schema";
import type { FoundPerson } from "./types";

export interface LookupMatch {
  readonly personId: string;
  readonly person: FoundPerson;
  readonly membership: "none" | "active" | "left";
}

export async function lookupForGroup(groupId: string, query: LookupQuery): Promise<LookupMatch | null> {
  const user = await db.user.findUnique({
    where: query.kind === "email" ? { email: query.value } : { username: query.value },
    select: {
      emailVerified: true,
      username: true,
      person: {
        select: {
          id: true,
          displayName: true,
          tint: true,
          buddy: true,
          onboardedAt: true,
          mergedIntoId: true,
          memberships: { where: { groupId }, select: { leftAt: true } },
        },
      },
    },
  });
  const person = user?.person;
  if (!user || !user.emailVerified || !user.username || !person || !person.onboardedAt || person.mergedIntoId) return null;
  const row = person.memberships[0];
  return {
    personId: person.id,
    person: {
      displayName: person.displayName,
      username: user.username,
      tint: parseTint(person.tint, person.displayName),
      buddy: parseBuddy(person.buddy),
    },
    membership: !row ? "none" : row.leftAt === null ? "active" : "left",
  };
}

export async function activeMember(groupId: string, personId: PersonId) {
  return db.groupMember.findFirst({
    where: { groupId, personId, leftAt: null, group: { deletedAt: null } },
    select: { role: true },
  });
}

export async function activeGuest(groupId: string, personId: string) {
  return db.groupMember.findFirst({
    where: { groupId, personId, leftAt: null, person: { userId: null, mergedIntoId: null, deletedAt: null } },
    select: { addedById: true },
  });
}

export async function activeMemberCount(groupId: string): Promise<number> {
  return db.groupMember.count({ where: { groupId, leftAt: null } });
}

export type ClaimBalance =
  | { readonly kind: "square" }
  | {
      readonly kind: "owes" | "owed";
      readonly amount: Cents;
      readonly currency: CurrencyCode;
      readonly counterpart: string | null;
    };

export interface GuestClaimView {
  readonly group: BillGroupRef & { readonly slug: string };
  readonly guest: PersonView;
  readonly addedBy: string | null;
  readonly addedAt: Date;
  readonly bills: { readonly count: number; readonly titles: readonly string[] };
  readonly claims: number;
  readonly payments: number;
  readonly balance: ClaimBalance;
  readonly alreadyMember: boolean;
}

const CLAIM_TITLES = 2;

function claimBalance(guest: PersonId, net: ReadonlyMap<PersonId, Cents> | undefined, currency: CurrencyCode) {
  const mine = net?.get(guest) ?? ZERO_CENTS;
  if (!net || mine === 0) return { balance: { kind: "square" } as const, counterpartId: null };
  const payment = minimumPayments(net).find((p) => (mine < 0 ? p.from === guest : p.to === guest));
  return {
    balance: { kind: mine < 0 ? "owes" : "owed", amount: cents(Math.abs(mine)), currency } as const,
    counterpartId: payment ? (mine < 0 ? payment.to : payment.from) : null,
  };
}

export async function getGuestClaim(token: string, viewer: PersonId | null): Promise<GuestClaimView | null> {
  const row = await db.guestToken.findUnique({
    where: { tokenHash: hashGuestToken(token) },
    select: {
      usedAt: true,
      expiresAt: true,
      personId: true,
      person: { select: { ...personSelect, userId: true, mergedIntoId: true, deletedAt: true } },
      group: { select: { id: true, slug: true, name: true, tint: true, art: true, currency: true, deletedAt: true } },
    },
  });
  if (!row || row.usedAt || row.expiresAt <= new Date() || row.group.deletedAt) return null;
  if (row.person.userId !== null || row.person.mergedIntoId !== null || row.person.deletedAt !== null) return null;
  const groupId = row.group.id;
  const guestId = personId(row.personId);

  const [membership, viewerRow, ledger, claims, payments] = await Promise.all([
    db.groupMember.findUnique({
      where: { groupId_personId: { groupId, personId: guestId } },
      select: { leftAt: true, joinedAt: true, addedBy: { select: { displayName: true } } },
    }),
    viewer
      ? db.groupMember.findUnique({ where: { groupId_personId: { groupId, personId: viewer } }, select: { id: true } })
      : Promise.resolve(null),
    loadGroupLedgers([groupId]),
    db.claim.count({ where: { personId: guestId, lineItem: { bill: { groupId, deletedAt: null } } } }),
    db.settlement.count({ where: { groupId, status: { not: "CANCELLED" }, OR: [{ fromId: guestId }, { toId: guestId }] } }),
  ]);
  if (!membership || membership.leftAt !== null || !isCurrencyCode(row.group.currency)) return null;

  const scope = toGroupId(groupId);
  const bills = inScope(ledger.bills, scope).filter((b) => b.payerId === guestId || (b.shares.get(guestId) ?? 0) > 0);
  const net = netBalances(inScope(ledger.debts, scope), inScope(ledger.settlements, scope), new Date()).get(row.group.currency);
  const { balance, counterpartId } = claimBalance(guestId, net, row.group.currency);
  const counterpart = counterpartId ? await db.person.findUnique({ where: { id: counterpartId }, select: { displayName: true } }) : null;

  return {
    group: { ...toGroupRef(row.group), slug: row.group.slug },
    guest: toPersonView(row.person),
    addedBy: membership.addedBy?.displayName ?? null,
    addedAt: membership.joinedAt,
    bills: { count: bills.length, titles: bills.slice(0, CLAIM_TITLES).map((b) => b.title) },
    claims,
    payments,
    balance: balance.kind === "square" ? balance : { ...balance, counterpart: counterpart?.displayName ?? null },
    alreadyMember: viewerRow !== null,
  };
}
