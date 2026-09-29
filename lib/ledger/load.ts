import "server-only";
import { computeShares } from "@/lib/bills/split";
import type { BillInput, SplitMethod, Tip } from "@/lib/bills/types";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { billId, groupId, lineItemId, personId, settlementId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { cents, type Cents } from "@/lib/money";
import { billDebts, type Debt, type SettlementEntry } from "./balances";

export interface BillTotalsEntry {
  readonly groupId: GroupId | null;
  readonly currency: CurrencyCode;
  readonly total: Cents;
  readonly shares: ReadonlyMap<PersonId, Cents>;
}

export interface Ledger {
  readonly debts: readonly Debt[];
  readonly settlements: readonly SettlementEntry[];
  readonly bills: readonly BillTotalsEntry[];
}

interface TipRow {
  readonly tipKind: "NONE" | "PERCENT" | "AMOUNT";
  readonly tipValue: number;
}

function toTip({ tipKind, tipValue }: TipRow): Tip {
  switch (tipKind) {
    case "NONE":
      return { kind: "NONE" };
    case "PERCENT":
      return { kind: "PERCENT", bps: tipValue };
    case "AMOUNT":
      return { kind: "AMOUNT", amount: cents(tipValue) };
  }
}

function currencyOf(value: string): CurrencyCode | null {
  return isCurrencyCode(value) ? value : null;
}

export async function loadGroupLedgers(groupIds: readonly string[]): Promise<Ledger> {
  if (groupIds.length === 0) return { debts: [], settlements: [], bills: [] };
  const ids = [...groupIds];

  const [bills, settlements] = await Promise.all([
    db.bill.findMany({
      where: { groupId: { in: ids }, deletedAt: null, status: "FINALIZED" },
      select: {
        id: true,
        groupId: true,
        currency: true,
        payerId: true,
        splitMethod: true,
        taxCents: true,
        tipKind: true,
        tipValue: true,
        discountCents: true,
        items: { select: { id: true, priceCents: true, claims: { select: { personId: true } } } },
        participants: { select: { personId: true, shares: true, percentBps: true, amountCents: true } },
      },
    }),
    db.settlement.findMany({
      where: { groupId: { in: ids }, status: { not: "CANCELLED" } },
      select: {
        id: true,
        groupId: true,
        currency: true,
        fromId: true,
        toId: true,
        amountCents: true,
        status: true,
        autoConfirmAt: true,
      },
    }),
  ]);

  const computed = bills.flatMap((bill) => {
    const currency = currencyOf(bill.currency);
    if (!currency) return [];
    const input: BillInput = {
      method: bill.splitMethod satisfies SplitMethod,
      taxCents: cents(bill.taxCents),
      tip: toTip(bill),
      discountCents: cents(bill.discountCents),
      items: bill.items.map((item) => ({
        id: lineItemId(item.id),
        priceCents: cents(item.priceCents),
        claimedBy: item.claims.map((c) => personId(c.personId)),
      })),
      participants: bill.participants.map((p) => ({
        personId: personId(p.personId),
        shares: p.shares,
        percentBps: p.percentBps,
        amountCents: p.amountCents === null ? null : cents(p.amountCents),
      })),
    };
    const split = computeShares(input);
    if (!split.ok) return [];
    const scope: GroupId | null = bill.groupId ? groupId(bill.groupId) : null;
    return [
      {
        debts: billDebts({ id: billId(bill.id), payerId: personId(bill.payerId), groupId: scope, currency }, split.value),
        totals: {
          groupId: scope,
          currency,
          total: split.value.totals.total,
          shares: new Map([...split.value.shares].map(([id, share]) => [id, share.total])),
        } satisfies BillTotalsEntry,
      },
    ];
  });

  const entries = settlements.flatMap((s): SettlementEntry[] => {
    const currency = currencyOf(s.currency);
    if (!currency) return [];
    return [
      {
        id: settlementId(s.id),
        groupId: s.groupId ? groupId(s.groupId) : null,
        currency,
        from: personId(s.fromId),
        to: personId(s.toId),
        amount: cents(s.amountCents),
        status: s.status,
        autoConfirmAt: s.autoConfirmAt,
      },
    ];
  });

  return { debts: computed.flatMap((c) => c.debts), settlements: entries, bills: computed.map((c) => c.totals) };
}
