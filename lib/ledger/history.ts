import { compareIds, type BillId, type PersonId, type SettlementId } from "@/lib/domain/ids";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { inScope, type Debt, type SettlementEntry } from "./balances";
import type { PairScope } from "./pair";
import { countsTowardBalance } from "./settlements";

export type PairEntry =
  | { readonly kind: "bill"; readonly billId: BillId; readonly at: Date; readonly delta: Cents; readonly running: Cents }
  | {
      readonly kind: "payment";
      readonly settlementId: SettlementId;
      readonly at: Date;
      readonly from: PersonId;
      readonly delta: Cents;
      readonly running: Cents;
    };

export interface PairHistory {
  readonly entries: readonly PairEntry[];
  readonly net: Cents;
}

type Raw =
  | { readonly kind: "bill"; readonly billId: BillId; readonly at: Date; readonly delta: number }
  | { readonly kind: "payment"; readonly settlementId: SettlementId; readonly at: Date; readonly from: PersonId; readonly delta: number };

const keyOf = (raw: Raw) => (raw.kind === "bill" ? raw.billId : raw.settlementId);

export function pairHistory(
  me: PersonId,
  other: PersonId,
  debts: readonly Debt[],
  settlements: readonly SettlementEntry[],
  paidAt: ReadonlyMap<SettlementId, Date>,
  scope: PairScope,
  now: Date,
): PairHistory {
  const between = <T extends { from: PersonId; to: PersonId }>(entry: T) =>
    (entry.from === me && entry.to === other) || (entry.from === other && entry.to === me);
  const inPair = <T extends { groupId: PairScope["groupId"] | null; currency: PairScope["currency"] }>(entries: readonly T[]) =>
    inScope(entries, scope.groupId).filter((entry) => entry.currency === scope.currency);

  const raws: Raw[] = [
    ...inPair(debts)
      .filter(between)
      .map((debt): Raw => ({ kind: "bill", billId: debt.billId, at: debt.occurredAt, delta: debt.to === me ? debt.amount : -debt.amount })),
    ...inPair(settlements)
      .filter((s) => between(s) && countsTowardBalance(s, now))
      .map(
        (s): Raw => ({
          kind: "payment",
          settlementId: s.id,
          at: paidAt.get(s.id) ?? now,
          from: s.from,
          delta: s.from === me ? s.amount : -s.amount,
        }),
      ),
  ].sort((a, b) => a.at.getTime() - b.at.getTime() || compareIds(keyOf(a), keyOf(b)));

  let running = 0;
  const entries = raws.map((raw): PairEntry => {
    running += raw.delta;
    return { ...raw, delta: cents(raw.delta), running: cents(running) };
  });
  return { entries, net: entries.at(-1)?.running ?? ZERO_CENTS };
}
