import { z } from "zod";
import { AMOUNT_MAX_CENTS, ITEM_NAME_MAX, ITEM_QUANTITY_MAX } from "@/lib/bills/schema";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/bills/types";
import { currencyCodeSchema, type CurrencyCode } from "@/lib/currency";
import type { Cents } from "@/lib/money";

export interface ScanItem {
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents | null;
  readonly guesses: readonly Cents[];
  readonly category: ItemCategory | null;
  readonly categories: readonly ItemCategory[];
}

export interface ScanResult {
  readonly merchant: string | null;
  readonly occurredOn: string | null;
  readonly currency: CurrencyCode;
  readonly items: readonly ScanItem[];
  readonly tax: Cents | null;
  readonly tip: Cents | null;
  readonly discount: Cents | null;
  readonly printedTotal: Cents | null;
  readonly flaggedCount: number;
  readonly currencyMismatch: boolean;
}

const centsSchema = z.number().int().min(0).max(AMOUNT_MAX_CENTS).transform((n) => n as Cents);

const scanItemSchema = z.object({
  name: z.string().min(1).max(ITEM_NAME_MAX),
  quantity: z.number().int().min(1).max(ITEM_QUANTITY_MAX),
  price: centsSchema.nullable(),
  guesses: z.array(centsSchema),
  category: z.enum(ITEM_CATEGORIES).nullable(),
  categories: z.array(z.enum(ITEM_CATEGORIES)),
});

export const scanResultSchema: z.ZodType<ScanResult> = z.object({
  merchant: z.string().nullable(),
  occurredOn: z.iso.date().nullable(),
  currency: currencyCodeSchema,
  items: z.array(scanItemSchema),
  tax: centsSchema.nullable(),
  tip: centsSchema.nullable(),
  discount: centsSchema.nullable(),
  printedTotal: centsSchema.nullable(),
  flaggedCount: z.number().int().min(0),
  currencyMismatch: z.boolean(),
});

export function parseScanResult(raw: unknown): ScanResult | null {
  const parsed = scanResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
