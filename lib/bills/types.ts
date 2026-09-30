import type { LineItemId, PersonId } from "@/lib/domain/ids";
import type { Cents } from "@/lib/money";

export const SPLIT_METHODS = ["ITEMS", "EVEN", "SHARES", "PERCENT", "AMOUNT"] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

export const BILL_STATUSES = ["DRAFT", "CLAIMING", "FINALIZED"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const ITEM_CATEGORIES = ["STARTER", "MAIN", "SIDE", "DRINK", "DESSERT", "GROCERY", "TRANSPORT", "HOUSEHOLD", "OTHER"] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export function isItemCategory(value: string): value is ItemCategory {
  return (ITEM_CATEGORIES as readonly string[]).includes(value);
}

export const FULL_PERCENT_BPS = 10_000;

export type Tip =
  | { readonly kind: "NONE" }
  | { readonly kind: "PERCENT"; readonly bps: number }
  | { readonly kind: "AMOUNT"; readonly amount: Cents };

export interface BillLine {
  readonly id: LineItemId;
  readonly priceCents: Cents;
  readonly claimedBy: readonly PersonId[];
}

export interface BillParticipantInput {
  readonly personId: PersonId;
  readonly shares: number;
  readonly percentBps: number | null;
  readonly amountCents: Cents | null;
}

export interface BillCharges {
  readonly taxCents: Cents;
  readonly tip: Tip;
  readonly discountCents: Cents;
}

export interface BillInput extends BillCharges {
  readonly method: SplitMethod;
  readonly items: readonly BillLine[];
  readonly participants: readonly BillParticipantInput[];
}

export interface BillTotals {
  readonly subtotal: Cents;
  readonly discount: Cents;
  readonly tax: Cents;
  readonly tip: Cents;
  readonly total: Cents;
}

export interface LineShare {
  readonly lineItemId: LineItemId;
  readonly amount: Cents;
}

export interface PersonShare {
  readonly items: Cents;
  readonly discount: Cents;
  readonly tax: Cents;
  readonly tip: Cents;
  readonly total: Cents;
  readonly lines: readonly LineShare[];
}

export type SplitError =
  | { readonly kind: "noParticipants" }
  | { readonly kind: "discountExceedsSubtotal"; readonly subtotal: Cents; readonly discount: Cents }
  | { readonly kind: "invalidParticipantInput"; readonly personIds: readonly PersonId[] }
  | { readonly kind: "unclaimedItems"; readonly lineItemIds: readonly LineItemId[] }
  | { readonly kind: "percentMismatch"; readonly assignedBps: number }
  | { readonly kind: "amountMismatch"; readonly assigned: Cents; readonly difference: Cents };

export interface BillSplit {
  readonly totals: BillTotals;
  readonly shares: ReadonlyMap<PersonId, PersonShare>;
}
