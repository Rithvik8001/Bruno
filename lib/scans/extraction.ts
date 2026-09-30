import { z } from "zod";
import { ITEM_CATEGORIES } from "@/lib/bills/types";
import type { CurrencyCode } from "@/lib/currency";
import { FLAG_CONFIDENCE, MAX_GUESSES } from "./rules";

const extractionItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int(),
  lineTotalMinor: z.number().int().nullable(),
  unitPriceMinor: z.number().int().nullable(),
  confidence: z.number(),
  alternativesMinor: z.array(z.number().int()),
  category: z.enum(ITEM_CATEGORIES),
  categoryAlt: z.enum(ITEM_CATEGORIES).nullable(),
});

export const SCAN_PROBLEMS = ["none", "notReceipt", "unclear"] as const;
export type ScanProblem = (typeof SCAN_PROBLEMS)[number];

export const extractionSchema = z.object({
  problem: z.enum(SCAN_PROBLEMS),
  merchant: z.string().nullable(),
  date: z.string().nullable(),
  currency: z.string().nullable(),
  items: z.array(extractionItemSchema),
  subtotalMinor: z.number().int().nullable(),
  taxMinor: z.number().int().nullable(),
  tipMinor: z.number().int().nullable(),
  discountMinor: z.number().int().nullable(),
  printedTotalMinor: z.number().int().nullable(),
  notes: z.array(z.string()),
});

export type Extraction = z.output<typeof extractionSchema>;
export type ExtractionItem = z.output<typeof extractionItemSchema>;

export function extractionInstructions(
  currency: CurrencyCode,
  minorUnits: number,
): string {
  const unit =
    minorUnits === 0
      ? `whole ${currency} units (no decimals)`
      : `minor units of ${currency} (${10 ** minorUnits} per major unit)`;
  return [
    "You read photos and PDFs of restaurant, shop and service receipts and return every purchased line as structured data.",
    `All money fields are integers in ${unit}. Never return decimals or strings for money.`,
    "First decide problem. 'notReceipt': the image is not a receipt, bill or invoice (a person, a menu, a screenshot, a random photo). 'unclear': it is a receipt but blur, darkness, glare or cropping makes most prices unreadable. Otherwise 'none'.",
    "When problem is not 'none', return empty items and null for every other field. Do not guess.",
    "Keep reasoning minimal. Read what is printed; do not deliberate.",
    "items: one entry per purchased line. lineTotalMinor is the amount printed for that line (already multiplied by quantity). Only set unitPriceMinor when a per-unit price is printed separately.",
    "A leading integer before the item name, or an 'xN' after it, is the quantity: '2 Negroni 28.00' and 'Negroni x2 28.00' are both quantity 2 with lineTotalMinor 2800 (the printed line amount, never divided).",
    "Do not include subtotal, tax, tip, service, total, payment, change, loyalty or header lines as items.",
    "Service charge, gratuity or tip lines go in tipMinor. Vouchers, promotions, coupons and negative lines go in discountMinor as a positive number, never as items.",
    "taxMinor is sales tax or VAT added on top. printedTotalMinor is the final amount due as printed. subtotalMinor is the items subtotal if printed.",
    `confidence is 0 to 1 for the line's price. Use below ${FLAG_CONFIDENCE} when digits are smudged, cut off or ambiguous, and put up to ${MAX_GUESSES} distinct plausible readings in alternativesMinor (most likely first). Otherwise leave alternativesMinor empty.`,
    "category is the best fit from the allowed list. categoryAlt is a second plausible category, or null.",
    "merchant is the venue or shop name as printed, without address. date is the purchase date as YYYY-MM-DD, or null if not visible. currency is the ISO 4217 code printed or clearly implied, or null.",
    "notes lists anything a person should double-check, in short phrases.",
  ].join("\n");
}
