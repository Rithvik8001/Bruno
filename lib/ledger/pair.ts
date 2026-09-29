import type { CurrencyCode } from "@/lib/currency";
import type { BillId, GroupId, PersonId } from "@/lib/domain/ids";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { debtKey, type DebtKey } from "./allocation";
import { balancesWith, inScope, type Debt, type SettlementEntry } from "./balances";
import { countsTowardBalance } from "./settlements";

export interface PairScope {
  readonly groupId: GroupId;
  readonly currency: CurrencyCode;
}

const inPair = <T extends { readonly groupId: GroupId | null; readonly currency: CurrencyCode }>(
  entries: readonly T[],
  scope: PairScope,
): T[] => inScope(entries, scope.groupId).filter((e) => e.currency === scope.currency);

export function pairBalance(
  me: PersonId,
  other: PersonId,
  debts: readonly Debt[],
  settlements: readonly SettlementEntry[],
  scope: PairScope,
  now: Date,
): Cents {
  const balances = balancesWith(me, inPair(debts, scope), inPair(settlements, scope), now);
  return balances.get(scope.currency)?.get(other) ?? ZERO_CENTS;
}

export function pendingBetween(
  settlements: readonly SettlementEntry[],
  from: PersonId,
  to: PersonId,
  scope: PairScope,
  now: Date,
): SettlementEntry[] {
  return inPair(settlements, scope).filter(
    (s) => s.status === "PENDING" && s.from === from && s.to === to && !countsTowardBalance(s, now),
  );
}

export interface OpenLine {
  readonly billId: BillId;
  readonly title: string;
  readonly amount: Cents;
}

export function openLines(
  debts: readonly Debt[],
  remaining: ReadonlyMap<DebtKey, Cents>,
  titles: ReadonlyMap<BillId, string>,
  from: PersonId,
  to: PersonId,
  scope: PairScope,
): OpenLine[] {
  return inPair(debts, scope)
    .filter((d) => d.from === from && d.to === to)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .flatMap((d) => {
      const left = remaining.get(debtKey(d)) ?? ZERO_CENTS;
      return left > 0 ? [{ billId: d.billId, title: titles.get(d.billId) ?? "", amount: left }] : [];
    });
}

export const SETTLE_ROLES = ["recipient", "payer", "confirm", "awaiting", "square"] as const;
export type SettleRole = (typeof SETTLE_ROLES)[number];

export interface SettleRoleInput {
  readonly balance: Cents;
  readonly pendingToMe: readonly SettlementEntry[];
  readonly pendingFromMe: readonly SettlementEntry[];
}

export function settleRole({ balance, pendingToMe, pendingFromMe }: SettleRoleInput): SettleRole {
  if (pendingToMe.length > 0) return "confirm";
  const pendingOut = sumCents(pendingFromMe.map((s) => s.amount));
  if (balance < 0 && pendingOut >= -balance) return "awaiting";
  if (balance < 0) return "payer";
  if (balance > 0) return "recipient";
  return pendingFromMe.length > 0 ? "awaiting" : "square";
}

export function openAmount(role: SettleRole, balance: Cents, pendingFromMe: readonly SettlementEntry[]): Cents {
  if (role === "recipient") return balance;
  if (role === "payer") return cents(Math.max(0, -balance - sumCents(pendingFromMe.map((s) => s.amount))));
  return ZERO_CENTS;
}
