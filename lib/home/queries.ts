import "server-only";
import {
  ledgerView,
  loadPeople,
  summarizeBills,
  toGroupRef,
  type BillGroupRef,
  type BillSummary,
} from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import type { GroupId, PersonId } from "@/lib/domain/ids";
import { debtKey } from "@/lib/ledger/allocation";
import { balancesWith, inScope } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";

const OPEN_BILLS = 5;
const PEOPLE_MAX = 8;
const CAPTION_TITLES = 2;
const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface HomePersonBalance {
  readonly person: PersonView;
  readonly balances: ReadonlyMap<CurrencyCode, Cents>;
  readonly primary: Cents;
  readonly openTitles: readonly string[];
  readonly groupId: GroupId | null;
}

export interface HomeNextUp {
  readonly person: PersonView;
  readonly amount: Cents;
  readonly bill: BillSummary;
  readonly titles: readonly string[];
}

export interface HomeSummaryData {
  readonly primaryCurrency: CurrencyCode;
  readonly net: ReadonlyMap<CurrencyCode, Cents>;
  readonly people: readonly HomePersonBalance[];
  readonly nextUp: HomeNextUp | null;
  readonly openBills: readonly BillSummary[];
  readonly hasAnyBills: boolean;
}

function sumByCurrency(balances: ReadonlyMap<CurrencyCode, ReadonlyMap<PersonId, Cents>>): Map<CurrencyCode, Cents> {
  return new Map([...balances].map(([currency, people]) => [currency, cents([...people.values()].reduce((a, b) => a + b, 0))]));
}

function primaryOf(
  balances: ReadonlyMap<CurrencyCode, ReadonlyMap<PersonId, Cents>>,
  fallback: CurrencyCode,
): CurrencyCode {
  let best: { currency: CurrencyCode; weight: number } | null = null;
  for (const [currency, people] of balances) {
    const weight = [...people.values()].reduce((a, b) => a + Math.abs(b), 0);
    if (weight > 0 && (!best || weight > best.weight)) best = { currency, weight };
  }
  return best?.currency ?? fallback;
}

export async function getHomeSummary(you: PersonId): Promise<HomeSummaryData> {
  const groupRows = await db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, tint: true, art: true, currency: true },
  });
  const groups = new Map<GroupId, BillGroupRef>(groupRows.map((g) => [toGroupRef(g).id, toGroupRef(g)]));
  const ledger = await loadGroupLedgers(groupRows.map((g) => g.id));
  const now = new Date();
  const view = ledgerView(ledger, now);

  const balances = balancesWith(you, ledger.debts, ledger.settlements, now);
  const fallback = groupRows.map((g) => g.currency).find(isCurrencyCode) ?? DEFAULT_CURRENCY;
  const primaryCurrency = primaryOf(balances, fallback);

  const recent = now.getTime() - RECENT_DAYS * DAY_MS;
  const counterparts = new Set<PersonId>();
  for (const people of balances.values()) for (const [id, amount] of people) if (amount !== 0) counterparts.add(id);
  for (const debt of ledger.debts) {
    if (debt.occurredAt.getTime() < recent) continue;
    if (debt.from === you) counterparts.add(debt.to);
    if (debt.to === you) counterparts.add(debt.from);
  }

  const titleOf = new Map(ledger.bills.map((b) => [b.billId, b.title]));
  const openDebts = ledger.debts.filter((d) => (view.remaining.get(debtKey(d)) ?? ZERO_CENTS) > 0);
  const people = await loadPeople([...counterparts, ...ledger.bills.map((b) => b.payerId)]);

  const groupFor = (person: PersonId): GroupId | null => {
    let best: { id: GroupId; weight: number } | null = null;
    for (const id of groups.keys()) {
      const scoped = balancesWith(you, inScope(ledger.debts, id), inScope(ledger.settlements, id), now);
      const weight = [...scoped.values()].reduce((a, m) => a + Math.abs(m.get(person) ?? 0), 0);
      if (!best || weight > best.weight) best = { id, weight };
    }
    return best?.id ?? null;
  };

  const personRows: HomePersonBalance[] = [...counterparts]
    .flatMap((id) => {
      const person = people.get(id);
      if (!person) return [];
      const byCurrency = new Map<CurrencyCode, Cents>();
      for (const [currency, amounts] of balances) {
        const amount = amounts.get(id) ?? ZERO_CENTS;
        if (amount !== 0) byCurrency.set(currency, amount);
      }
      const titles = openDebts
        .filter((d) => (d.from === id && d.to === you) || (d.from === you && d.to === id))
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .map((d) => titleOf.get(d.billId) ?? "");
      return [
        {
          person,
          balances: byCurrency,
          primary: byCurrency.get(primaryCurrency) ?? ZERO_CENTS,
          openTitles: [...new Set(titles)].filter(Boolean).slice(0, CAPTION_TITLES),
          groupId: groupFor(id),
        },
      ];
    })
    .sort((a, b) => Math.abs(b.primary) - Math.abs(a.primary) || b.balances.size - a.balances.size)
    .slice(0, PEOPLE_MAX);

  const summaries = summarizeBills(ledger.bills, view, people, groups, you, now);
  const openBills = summaries.filter((b) => b.yourBalance !== 0).slice(0, OPEN_BILLS);

  const lead = personRows.find((p) => p.primary !== 0);
  const leadBill = lead
    ? summaries.find(
        (b) =>
          b.currency === primaryCurrency &&
          openDebts.some(
            (d) => d.billId === b.id && ((d.from === lead.person.id && d.to === you) || (d.from === you && d.to === lead.person.id)),
          ),
      )
    : undefined;

  return {
    primaryCurrency,
    net: sumByCurrency(balances),
    people: personRows,
    nextUp: lead && leadBill ? { person: lead.person, amount: lead.primary, bill: leadBill, titles: lead.openTitles } : null,
    openBills,
    hasAnyBills: ledger.bills.length > 0,
  };
}
