import type { CurrencyCode } from "@/lib/currency";
import type { GroupId, PersonId } from "@/lib/domain/ids";
import { remainingByDebt } from "@/lib/ledger/allocation";
import { balancesWith, inScope, type Debt, type SettlementEntry } from "@/lib/ledger/balances";
import { openAmount, openLines, pendingBetween, settleRole, type OpenLine } from "@/lib/ledger/pair";
import type { Cents } from "@/lib/money";

export interface LedgerSlice {
  readonly debts: readonly Debt[];
  readonly settlements: readonly SettlementEntry[];
}

export interface OwedEntry {
  readonly groupId: GroupId;
  readonly other: PersonId;
  readonly currency: CurrencyCode;
  readonly amount: Cents;
}

export function openDebts(me: PersonId, groupIds: readonly GroupId[], ledger: LedgerSlice, now: Date): OwedEntry[] {
  return groupIds.flatMap((groupId) => {
    const balances = balancesWith(me, inScope(ledger.debts, groupId), inScope(ledger.settlements, groupId), now);
    return [...balances].flatMap(([currency, byPerson]) =>
      [...byPerson].flatMap(([other, balance]): OwedEntry[] => {
        if (balance >= 0) return [];
        const pendingFromMe = pendingBetween(ledger.settlements, me, other, { groupId, currency }, now);
        const role = settleRole({ balance, pendingToMe: [], pendingFromMe });
        const amount = openAmount(role, balance, pendingFromMe);
        return amount > 0 ? [{ groupId, other, currency, amount }] : [];
      }),
    );
  });
}

export function owedLines(
  me: PersonId,
  entry: OwedEntry,
  ledger: LedgerSlice,
  titles: ReadonlyMap<Debt["billId"], string>,
  now: Date,
): OpenLine[] {
  const remaining = remainingByDebt(ledger.debts, ledger.settlements, now);
  return openLines(ledger.debts, remaining, titles, me, entry.other, { groupId: entry.groupId, currency: entry.currency });
}
