import { billDay } from "@/lib/dates";
import type { CurrencyCode } from "@/lib/currency";
import type { GroupId, PersonId, SettlementId } from "@/lib/domain/ids";
import { balancesWith, type Debt, type SettlementEntry } from "@/lib/ledger/balances";
import { countsTowardBalance } from "@/lib/ledger/settlements";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";

const MONTH_KEY_LENGTH = 7;

export interface RecapBill {
  readonly occurredAt: Date;
  readonly payerId: PersonId;
  readonly groupId: GroupId | null;
  readonly currency: CurrencyCode;
  readonly shares: ReadonlyMap<PersonId, Cents>;
}

export interface RecapLedger {
  readonly debts: readonly Debt[];
  readonly settlements: readonly SettlementEntry[];
  readonly bills: readonly RecapBill[];
  readonly payments: ReadonlyMap<SettlementId, { readonly at: Date }>;
}

export interface RecapTop {
  readonly personId: PersonId;
  readonly bills: number;
  readonly balance: Cents;
}

export interface MonthRecap {
  readonly billCount: number;
  readonly currency: CurrencyCode;
  readonly share: Cents;
  readonly settled: Cents;
  readonly groups: readonly { readonly groupId: GroupId; readonly amount: Cents }[];
  readonly top: RecapTop | null;
}

function bump<K>(map: Map<K, number>, key: K, by: number): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function largest<K>(map: ReadonlyMap<K, number>): K | null {
  let best: K | null = null;
  let bestValue = -Infinity;
  for (const [key, value] of map) {
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}

export function monthRecap(
  me: PersonId,
  ledger: RecapLedger,
  monthKey: string,
  monthOf: (date: Date) => string,
  now: Date,
): MonthRecap | null {
  const mine = ledger.bills.filter(
    (bill) =>
      billDay(bill.occurredAt).slice(0, MONTH_KEY_LENGTH) === monthKey &&
      (bill.payerId === me || (bill.shares.get(me) ?? ZERO_CENTS) > 0),
  );
  if (mine.length === 0) return null;

  const byCurrency = new Map<CurrencyCode, number>();
  for (const bill of mine) bump(byCurrency, bill.currency, bill.shares.get(me) ?? ZERO_CENTS);
  const currency = largest(byCurrency) ?? mine[0]?.currency;
  if (!currency) return null;

  const byGroup = new Map<GroupId, number>();
  const together = new Map<PersonId, number>();
  for (const bill of mine) {
    const share = bill.shares.get(me) ?? ZERO_CENTS;
    if (bill.currency === currency && bill.groupId && share > 0) bump(byGroup, bill.groupId, share);
    const people = new Set<PersonId>([bill.payerId, ...[...bill.shares].filter(([, amount]) => amount > 0).map(([person]) => person)]);
    people.delete(me);
    for (const person of people) bump(together, person, 1);
  }

  const settled = sumCents(
    ledger.settlements
      .filter((s) => (s.from === me || s.to === me) && s.currency === currency && countsTowardBalance(s, now))
      .filter((s) => {
        const paidAt = ledger.payments.get(s.id)?.at;
        return paidAt !== undefined && monthOf(paidAt) === monthKey;
      })
      .map((s) => s.amount),
  );

  const topPerson = largest(together);
  const balances = balancesWith(me, ledger.debts, ledger.settlements, now).get(currency);
  return {
    billCount: mine.length,
    currency,
    share: cents(byCurrency.get(currency) ?? 0),
    settled,
    groups: [...byGroup].map(([groupId, amount]) => ({ groupId, amount: cents(amount) })).sort((a, b) => b.amount - a.amount),
    top: topPerson
      ? { personId: topPerson, bills: together.get(topPerson) ?? 0, balance: balances?.get(topPerson) ?? ZERO_CENTS }
      : null,
  };
}
