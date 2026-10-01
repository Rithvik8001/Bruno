import "server-only";
import { loadPeople, ledgerView, toGroupRef, type BillGroupRef, type LedgerView } from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { localDay } from "@/lib/dates";
import { db } from "@/lib/db";
import { groupId, type BillId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { loadDetailedLedger, type BillTotalsEntry, type DetailedLedger } from "@/lib/ledger/load";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import type { AskCard, AskStep } from "./result";
import { ASK_GROUPS_MAX, ASK_PEOPLE_MAX } from "./rules";

export interface AskGroup {
  readonly index: number;
  readonly id: GroupId;
  readonly ref: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly members: readonly PersonId[];
  readonly joinedAt: Date;
}

export interface AskAccount {
  readonly you: PersonId;
  readonly youIndex: number;
  readonly groups: readonly AskGroup[];
  readonly people: readonly PersonView[];
  readonly indexOf: ReadonlyMap<PersonId, number>;
  readonly scope: AskGroup | null;
}

export interface FoundBill {
  readonly id: BillId;
  readonly slug: string;
  readonly title: string;
  readonly groupId: GroupId;
  readonly claimCode: string | null;
  readonly finalized: boolean;
}

export interface AskContext {
  readonly account: AskAccount;
  readonly ledger: DetailedLedger;
  readonly view: LedgerView;
  readonly billsById: ReadonlyMap<BillId, BillTotalsEntry>;
  readonly everyone: ReadonlyMap<PersonId, PersonView>;
  readonly now: Date;
  readonly today: string;
  readonly backHref: string;
  readonly cards: Map<string, AskCard>;
  readonly found: Map<string, FoundBill>;
  readonly emit: (step: AskStep) => void;
}

export async function loadAskAccount(you: PersonId, scopeGroupId: string | null): Promise<AskAccount | null> {
  const rows = await db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tint: true,
      art: true,
      currency: true,
      members: { where: { leftAt: null }, orderBy: { joinedAt: "asc" }, select: { joinedAt: true, person: { select: personSelect } } },
    },
  });
  const scoped = scopeGroupId === null ? undefined : rows.find((row) => row.id === scopeGroupId);
  if (scopeGroupId !== null && !scoped) return null;
  const head = rows.slice(0, ASK_GROUPS_MAX);
  const kept = scoped && !head.includes(scoped) ? [...head.slice(0, ASK_GROUPS_MAX - 1), scoped] : head;

  const people: PersonView[] = [];
  const indexOf = new Map<PersonId, number>();
  const add = (person: PersonView) => {
    if (indexOf.has(person.id) || people.length >= ASK_PEOPLE_MAX) return;
    indexOf.set(person.id, people.length);
    people.push(person);
  };
  const views = kept.map((row) => row.members.map((member) => ({ view: toPersonView(member.person), joinedAt: member.joinedAt })));
  for (const members of views) for (const member of members) if (member.view.id === you) add(member.view);
  for (const members of views) for (const member of members) add(member.view);
  const youIndex = indexOf.get(you);
  if (youIndex === undefined) return null;

  const groups = kept.map((row, index): AskGroup => {
    const members = views[index] ?? [];
    return {
      index,
      id: groupId(row.id),
      ref: toGroupRef(row),
      currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
      members: members.map((member) => member.view.id).filter((id) => indexOf.has(id)),
      joinedAt: members.find((member) => member.view.id === you)?.joinedAt ?? new Date(0),
    };
  });
  return { you, youIndex, groups, people, indexOf, scope: scoped ? (groups.find((group) => group.id === scoped.id) ?? null) : null };
}

export interface AskContextInput {
  readonly account: AskAccount;
  readonly timeZone: string;
  readonly backHref: string;
  readonly emit: (step: AskStep) => void;
}

export async function buildAskContext({ account, timeZone, backHref, emit }: AskContextInput): Promise<AskContext> {
  const ledger = await loadDetailedLedger(account.groups.map((group) => group.id));
  const now = new Date();
  const known = new Map<PersonId, PersonView>(account.people.map((person) => [person.id, person]));
  const seen = new Set<PersonId>([
    ...ledger.bills.flatMap((bill) => [bill.payerId, ...bill.shares.keys()]),
    ...ledger.settlements.flatMap((s) => [s.from, s.to]),
  ]);
  const missing = [...seen].filter((id) => !known.has(id));
  const extra = await loadPeople(missing);
  return {
    account,
    ledger,
    view: ledgerView(ledger, now),
    billsById: new Map(ledger.bills.map((bill) => [bill.billId, bill])),
    everyone: new Map([...known, ...extra]),
    now,
    today: localDay(timeZone, now),
    backHref,
    cards: new Map(),
    found: new Map(),
    emit,
  };
}
