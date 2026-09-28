import { compareIds, type PersonId } from "@/lib/domain/ids";
import { cents, type Cents } from "@/lib/money";

export interface Payment {
  readonly from: PersonId;
  readonly to: PersonId;
  readonly amount: Cents;
}

interface Position {
  readonly person: PersonId;
  amount: number;
}

const biggestFirst = (a: Position, b: Position): number => b.amount - a.amount || compareIds(a.person, b.person);

export function minimumPayments(net: ReadonlyMap<PersonId, Cents>): Payment[] {
  const total = [...net.values()].reduce<number>((a, b) => a + b, 0);
  if (total !== 0) throw new RangeError(`Balances must sum to zero, got ${total}`);

  const creditors: Position[] = [];
  const debtors: Position[] = [];
  for (const [person, amount] of net) {
    if (amount > 0) creditors.push({ person, amount });
    if (amount < 0) debtors.push({ person, amount: -amount });
  }

  const payments: Payment[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(biggestFirst);
    debtors.sort(biggestFirst);
    const creditor = creditors[0];
    const debtor = debtors[0];
    if (!creditor || !debtor) break;
    const amount = Math.min(creditor.amount, debtor.amount);
    payments.push({ from: debtor.person, to: creditor.person, amount: cents(amount) });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }
  return payments;
}
