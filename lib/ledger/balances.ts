import type { BillSplit } from "@/lib/bills/types";
import type { CurrencyCode } from "@/lib/currency";
import type { BillId, GroupId, PersonId, SettlementId } from "@/lib/domain/ids";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import type { SettlementStatus } from "./rules";
import { countsTowardBalance } from "./settlements";

export interface LedgerScope {
  readonly groupId: GroupId | null;
  readonly currency: CurrencyCode;
}

export interface Debt extends LedgerScope {
  readonly billId: BillId;
  readonly from: PersonId;
  readonly to: PersonId;
  readonly amount: Cents;
}

export interface SettlementEntry extends LedgerScope {
  readonly id: SettlementId;
  readonly from: PersonId;
  readonly to: PersonId;
  readonly amount: Cents;
  readonly status: SettlementStatus;
  readonly autoConfirmAt: Date | null;
}

export interface BillLedgerSource extends LedgerScope {
  readonly id: BillId;
  readonly payerId: PersonId;
}

export type BalancesByCurrency = ReadonlyMap<CurrencyCode, ReadonlyMap<PersonId, Cents>>;

export function billDebts(bill: BillLedgerSource, split: BillSplit): Debt[] {
  return [...split.shares]
    .filter(([personId, share]) => personId !== bill.payerId && share.total > 0)
    .map(([personId, share]) => ({
      billId: bill.id,
      groupId: bill.groupId,
      currency: bill.currency,
      from: personId,
      to: bill.payerId,
      amount: share.total,
    }));
}

export function inScope<T extends LedgerScope>(entries: readonly T[], groupId: GroupId | null): T[] {
  return entries.filter((entry) => entry.groupId === groupId);
}

interface Transfer {
  readonly currency: CurrencyCode;
  readonly creditor: PersonId;
  readonly debtor: PersonId;
  readonly amount: Cents;
}

function transfers(debts: readonly Debt[], settlements: readonly SettlementEntry[], now: Date): Transfer[] {
  return [
    ...debts.map((d) => ({ currency: d.currency, creditor: d.to, debtor: d.from, amount: d.amount })),
    ...settlements
      .filter((s) => countsTowardBalance(s, now))
      .map((s) => ({ currency: s.currency, creditor: s.from, debtor: s.to, amount: s.amount })),
  ];
}

function addTo(
  target: Map<CurrencyCode, Map<PersonId, Cents>>,
  currency: CurrencyCode,
  person: PersonId,
  delta: number,
): void {
  const balances = target.get(currency) ?? new Map<PersonId, Cents>();
  balances.set(person, cents((balances.get(person) ?? ZERO_CENTS) + delta));
  target.set(currency, balances);
}

export function netBalances(
  debts: readonly Debt[],
  settlements: readonly SettlementEntry[],
  now: Date,
): BalancesByCurrency {
  const result = new Map<CurrencyCode, Map<PersonId, Cents>>();
  for (const t of transfers(debts, settlements, now)) {
    addTo(result, t.currency, t.creditor, t.amount);
    addTo(result, t.currency, t.debtor, -t.amount);
  }
  return result;
}

export function balancesWith(
  me: PersonId,
  debts: readonly Debt[],
  settlements: readonly SettlementEntry[],
  now: Date,
): BalancesByCurrency {
  const result = new Map<CurrencyCode, Map<PersonId, Cents>>();
  for (const t of transfers(debts, settlements, now)) {
    if (t.creditor === me && t.debtor !== me) addTo(result, t.currency, t.debtor, t.amount);
    if (t.debtor === me && t.creditor !== me) addTo(result, t.currency, t.creditor, -t.amount);
  }
  return result;
}

export function balanceOf(balances: BalancesByCurrency, person: PersonId): ReadonlyMap<CurrencyCode, Cents> {
  return new Map([...balances].map(([currency, byPerson]) => [currency, byPerson.get(person) ?? ZERO_CENTS]));
}

export function isAllSquare(balances: ReadonlyMap<CurrencyCode, Cents>): boolean {
  return [...balances.values()].every((amount) => amount === 0);
}
