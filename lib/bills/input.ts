import { lineItemId, personId } from "@/lib/domain/ids";
import { cents } from "@/lib/money";
import type { BillTipValue, CreateBillValues } from "./schema";
import type { BillInput, Tip } from "./types";

export type BillSplitSource = Pick<
  CreateBillValues,
  "items" | "taxCents" | "tip" | "discountCents" | "method" | "participants"
>;

export function tipOf(tip: BillTipValue): Tip {
  switch (tip.kind) {
    case "NONE":
      return { kind: "NONE" };
    case "PERCENT":
      return { kind: "PERCENT", bps: tip.bps };
    case "AMOUNT":
      return { kind: "AMOUNT", amount: cents(tip.cents) };
  }
}

export function provisionalLineId(index: number) {
  return lineItemId(`line-${index}`);
}

export function toBillInput(source: BillSplitSource): BillInput {
  const byItems = source.method === "ITEMS";
  return {
    method: source.method,
    taxCents: cents(source.taxCents),
    tip: tipOf(source.tip),
    discountCents: cents(source.discountCents),
    items: source.items.map((item, index) => ({
      id: provisionalLineId(index),
      priceCents: cents(item.priceCents),
      claimedBy: byItems ? item.claimedBy.map(personId) : [],
    })),
    participants: byItems
      ? []
      : source.participants.map((p) => ({
          personId: personId(p.personId),
          shares: p.shares,
          percentBps: p.percentBps,
          amountCents: p.amountCents === null ? null : cents(p.amountCents),
        })),
  };
}
