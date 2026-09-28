import { err, ok, type Result } from "@/lib/domain/result";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { FULL_PERCENT_BPS, type BillCharges, type BillTotals, type SplitError, type Tip } from "./types";

export function tipAmount(tip: Tip, subtotal: Cents): Cents {
  switch (tip.kind) {
    case "NONE":
      return ZERO_CENTS;
    case "AMOUNT":
      return tip.amount;
    case "PERCENT":
      return cents(Math.floor((subtotal * tip.bps + FULL_PERCENT_BPS / 2) / FULL_PERCENT_BPS));
  }
}

export function billTotals(
  itemPrices: readonly Cents[],
  { taxCents, tip, discountCents }: BillCharges,
): Result<BillTotals, Extract<SplitError, { kind: "discountExceedsSubtotal" }>> {
  const subtotal = sumCents(itemPrices);
  if (discountCents > subtotal) {
    return err({ kind: "discountExceedsSubtotal", subtotal, discount: discountCents });
  }
  const tipCents = tipAmount(tip, subtotal);
  return ok({
    subtotal,
    discount: discountCents,
    tax: taxCents,
    tip: tipCents,
    total: cents(subtotal - discountCents + taxCents + tipCents),
  });
}
