import { compareIds, type BillId, type PersonId } from "@/lib/domain/ids";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import type { Debt, SettlementEntry } from "./balances";
import { countsTowardBalance } from "./settlements";

export type DebtKey = string & { readonly __debtKey: true };

export function debtKey(debt: Pick<Debt, "billId" | "from">): DebtKey {
  return `${debt.billId}|${debt.from}` as DebtKey;
}

type Direction = Pick<Debt, "groupId" | "currency" | "from" | "to">;

const directionKey = (d: Direction) => `${d.groupId ?? ""}|${d.currency}|${d.from}|${d.to}`;

const reverseKey = (d: Direction) => directionKey({ ...d, from: d.to, to: d.from });

const oldestFirst = (a: Debt, b: Debt) =>
  a.occurredAt.getTime() - b.occurredAt.getTime() || compareIds(a.billId, b.billId);

export function remainingByDebt(
  debts: readonly Debt[],
  settlements: readonly SettlementEntry[],
  now: Date,
): ReadonlyMap<DebtKey, Cents> {
  const coverage = new Map<string, number>();
  const add = (key: string, amount: number) => coverage.set(key, (coverage.get(key) ?? 0) + amount);

  for (const s of settlements) {
    if (countsTowardBalance(s, now)) add(directionKey(s), s.amount);
  }
  for (const d of debts) add(reverseKey(d), d.amount);

  const remaining = new Map<DebtKey, Cents>();
  for (const debt of [...debts].sort(oldestFirst)) {
    const key = directionKey(debt);
    const available = coverage.get(key) ?? 0;
    const paid = Math.min(debt.amount, available);
    coverage.set(key, available - paid);
    remaining.set(debtKey(debt), cents(debt.amount - paid));
  }
  return remaining;
}

export function outstandingByBill(
  debts: readonly Debt[],
  remaining: ReadonlyMap<DebtKey, Cents>,
): ReadonlyMap<BillId, Cents> {
  const result = new Map<BillId, Cents>();
  for (const d of debts) {
    result.set(d.billId, cents((result.get(d.billId) ?? ZERO_CENTS) + (remaining.get(debtKey(d)) ?? ZERO_CENTS)));
  }
  return result;
}

export const PERSON_BILL_STATUSES = ["payer", "paid", "owes", "out"] as const;
export type PersonBillStatus = (typeof PERSON_BILL_STATUSES)[number];

export function personBillStatus(
  person: PersonId,
  bill: { readonly id: BillId; readonly payerId: PersonId; readonly shares: ReadonlyMap<PersonId, Cents> },
  remaining: ReadonlyMap<DebtKey, Cents>,
): PersonBillStatus {
  if (person === bill.payerId) return "payer";
  const share = bill.shares.get(person) ?? ZERO_CENTS;
  if (share <= 0) return "out";
  return (remaining.get(debtKey({ billId: bill.id, from: person })) ?? ZERO_CENTS) > 0 ? "owes" : "paid";
}
