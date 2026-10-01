import { billInputFromRow, type BillSplitRow } from "@/lib/bills/rows";
import { spendLines } from "@/lib/bills/spend";
import { computeShares } from "@/lib/bills/split";
import type { ItemCategory, SplitMethod } from "@/lib/bills/types";
import type { CurrencyCode } from "@/lib/currency";
import { lineItemId, personId, type PersonId } from "@/lib/domain/ids";
import type { PaymentMethod, SettlementStatus } from "@/lib/ledger/rules";
import { countsTowardBalance } from "@/lib/ledger/settlements";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { exportStatusLabels } from "./messages";

export interface BillSource extends BillSplitRow {
  readonly day: string;
  readonly group: string;
  readonly title: string;
  readonly currency: CurrencyCode;
  readonly payerId: string;
  readonly createdById: string;
  readonly totalCents: number;
  readonly items: readonly {
    readonly id: string;
    readonly name: string;
    readonly quantity: number;
    readonly category: ItemCategory | null;
    readonly priceCents: number;
    readonly claims: readonly { readonly personId: string }[];
  }[];
}

export interface PaymentSource {
  readonly day: string;
  readonly group: string;
  readonly currency: CurrencyCode;
  readonly fromId: string;
  readonly toId: string;
  readonly recordedById: string;
  readonly amountCents: number;
  readonly method: PaymentMethod;
  readonly note: string | null;
  readonly status: SettlementStatus;
  readonly autoConfirmAt: Date | null;
}

export interface BillRow {
  readonly day: string;
  readonly group: string;
  readonly title: string;
  readonly paidBy: string;
  readonly currency: CurrencyCode;
  readonly total: Cents;
  readonly yourShare: Cents | null;
  readonly method: SplitMethod;
  readonly subtotal: Cents;
  readonly tax: Cents;
  readonly tip: Cents | null;
  readonly discount: Cents;
  readonly addedBy: string;
}

export interface ItemRow {
  readonly day: string;
  readonly group: string;
  readonly bill: string;
  readonly name: string;
  readonly quantity: number;
  readonly category: ItemCategory | null;
  readonly currency: CurrencyCode;
  readonly price: Cents;
  readonly between: readonly string[];
  readonly yourShare: Cents | null;
}

export interface PaymentRow {
  readonly day: string;
  readonly group: string;
  readonly from: string;
  readonly to: string;
  readonly currency: CurrencyCode;
  readonly amount: Cents;
  readonly method: PaymentMethod;
  readonly status: string;
  readonly note: string;
  readonly recordedBy: string;
}

export type Names = ReadonlyMap<string, string>;

const nameOf = (names: Names, id: string) => names.get(id) ?? "";

export function billRows(bills: readonly BillSource[], names: Names, you: PersonId): BillRow[] {
  return bills.map((bill) => {
    const split = computeShares(billInputFromRow(bill));
    const shared = {
      day: bill.day,
      group: bill.group,
      title: bill.title,
      paidBy: nameOf(names, bill.payerId),
      currency: bill.currency,
      method: bill.splitMethod,
      addedBy: nameOf(names, bill.createdById),
    };
    if (!split.ok) {
      return {
        ...shared,
        total: cents(bill.totalCents),
        yourShare: null,
        subtotal: sumCents(bill.items.map((item) => cents(item.priceCents))),
        tax: cents(bill.taxCents),
        tip: null,
        discount: cents(bill.discountCents),
      };
    }
    const { totals, shares } = split.value;
    return {
      ...shared,
      total: totals.total,
      yourShare: shares.get(you)?.total ?? ZERO_CENTS,
      subtotal: totals.subtotal,
      tax: totals.tax,
      tip: totals.tip,
      discount: totals.discount,
    };
  });
}

export function itemRows(bills: readonly BillSource[], names: Names, you: PersonId): ItemRow[] {
  return bills.flatMap((bill) => {
    const split = computeShares(billInputFromRow(bill));
    const mine = split.ok ? split.value.shares.get(you) : undefined;
    const spend = bill.items.map((item) => ({ id: lineItemId(item.id), priceCents: cents(item.priceCents), category: item.category }));
    const yours = new Map(mine ? spendLines(spend, mine, bill.splitMethod).map((line) => [line.lineItemId, line.amount]) : []);
    const everyone = bill.participants.map((p) => nameOf(names, p.personId));
    return bill.items.map((item) => ({
      day: bill.day,
      group: bill.group,
      bill: bill.title,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      currency: bill.currency,
      price: cents(item.priceCents),
      between: bill.splitMethod === "ITEMS" ? item.claims.map((claim) => nameOf(names, claim.personId)) : everyone,
      yourShare: split.ok ? (yours.get(lineItemId(item.id)) ?? ZERO_CENTS) : null,
    }));
  });
}

function statusOf(payment: PaymentSource, now: Date): string {
  if (payment.status === "CANCELLED") return exportStatusLabels.cancelled;
  return countsTowardBalance(payment, now) ? exportStatusLabels.confirmed : exportStatusLabels.pending;
}

export function paymentRows(payments: readonly PaymentSource[], names: Names, now: Date): PaymentRow[] {
  return payments.map((payment) => ({
    day: payment.day,
    group: payment.group,
    from: nameOf(names, payment.fromId),
    to: nameOf(names, payment.toId),
    currency: payment.currency,
    amount: cents(payment.amountCents),
    method: payment.method,
    status: statusOf(payment, now),
    note: payment.note ?? "",
    recordedBy: nameOf(names, payment.recordedById),
  }));
}

export function peopleIn(bills: readonly BillSource[], payments: readonly PaymentSource[]): PersonId[] {
  const ids = new Set<string>();
  for (const bill of bills) {
    ids.add(bill.payerId);
    ids.add(bill.createdById);
    for (const participant of bill.participants) ids.add(participant.personId);
    for (const item of bill.items) for (const claim of item.claims) ids.add(claim.personId);
  }
  for (const payment of payments) {
    ids.add(payment.fromId);
    ids.add(payment.toId);
    ids.add(payment.recordedById);
  }
  return [...ids].map(personId);
}
