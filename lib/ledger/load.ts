import "server-only";
import { billInputFromRow, billSplitSelect } from "@/lib/bills/rows";
import { computeShares } from "@/lib/bills/split";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { billId, groupId, personId, settlementId, type BillId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { cents, type Cents } from "@/lib/money";
import { billDebts, type Debt, type SettlementEntry } from "./balances";

export interface BillTotalsEntry {
  readonly billId: BillId;
  readonly slug: string;
  readonly title: string;
  readonly occurredAt: Date;
  readonly finalizedAt: Date | null;
  readonly payerId: PersonId;
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

function currencyOf(value: string): CurrencyCode | null {
  return isCurrencyCode(value) ? value : null;
}

export async function loadGroupLedgers(groupIds: readonly string[]): Promise<Ledger> {
  if (groupIds.length === 0) return { debts: [], settlements: [], bills: [] };
  const ids = [...groupIds];

  const [bills, settlements] = await Promise.all([
    db.bill.findMany({
      where: { groupId: { in: ids }, deletedAt: null, status: "FINALIZED" },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        occurredAt: true,
        finalizedAt: true,
        groupId: true,
        currency: true,
        payerId: true,
        ...billSplitSelect,
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
    const split = computeShares(billInputFromRow(bill));
    if (!split.ok) return [];
    const scope: GroupId | null = bill.groupId ? groupId(bill.groupId) : null;
    const id = billId(bill.id);
    const payer = personId(bill.payerId);
    return [
      {
        debts: billDebts({ id, payerId: payer, groupId: scope, currency, occurredAt: bill.occurredAt }, split.value),
        totals: {
          billId: id,
          slug: bill.slug,
          title: bill.title,
          occurredAt: bill.occurredAt,
          finalizedAt: bill.finalizedAt,
          payerId: payer,
          groupId: scope,
          currency,
          total: split.value.totals.total,
          shares: new Map([...split.value.shares].map(([pid, share]) => [pid, share.total])),
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
