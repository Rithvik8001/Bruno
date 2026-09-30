import { AMOUNT_MAX_CENTS, ITEM_NAME_MAX, ITEM_QUANTITY_MAX } from "@/lib/bills/schema";
import type { ItemCategory } from "@/lib/bills/types";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { cents, type Cents } from "@/lib/money";
import type { Extraction, ExtractionItem } from "./extraction";
import type { ScanItem, ScanResult } from "./result";
import { FLAG_CONFIDENCE, MAX_GUESSES, SCAN_ITEMS_MAX } from "./rules";

const DAY_MS = 24 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = DAY_MS;
const PAST_TOLERANCE_MS = 2 * 365 * DAY_MS;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function validAmount(value: number | null | undefined): Cents | null {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value <= 0 || value > AMOUNT_MAX_CENTS) return null;
  return cents(value);
}

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, ITEM_NAME_MAX);
}

function cleanQuantity(raw: number): number {
  if (!Number.isInteger(raw)) return 1;
  return Math.min(ITEM_QUANTITY_MAX, Math.max(1, raw));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function normalizeItem(item: ExtractionItem): ScanItem | null {
  const name = cleanName(item.name);
  if (name === "") return null;
  const quantity = cleanQuantity(item.quantity);
  const lineTotal = validAmount(item.lineTotalMinor ?? (item.unitPriceMinor === null ? null : item.unitPriceMinor * quantity));
  const alternatives = item.alternativesMinor.map(validAmount).filter((v): v is Cents => v !== null);
  const flagged = item.confidence < FLAG_CONFIDENCE || alternatives.length > 0;
  if (lineTotal === null && alternatives.length === 0) return null;
  const guesses = flagged ? unique([...(lineTotal === null ? [] : [lineTotal]), ...alternatives]).slice(0, MAX_GUESSES) : [];
  const categories: ItemCategory[] = unique([item.category, ...(item.categoryAlt === null ? [] : [item.categoryAlt])]);
  return {
    name,
    quantity,
    price: flagged ? null : lineTotal,
    guesses,
    category: categories[0] ?? null,
    categories,
  };
}

function normalizeDate(raw: string | null, now: Date): string | null {
  if (raw === null || !ISO_DAY.test(raw)) return null;
  const at = Date.parse(`${raw}T12:00:00.000Z`);
  if (Number.isNaN(at)) return null;
  const delta = at - now.getTime();
  if (delta > FUTURE_TOLERANCE_MS || -delta > PAST_TOLERANCE_MS) return null;
  return raw;
}

function normalizeMerchant(raw: string | null): string | null {
  if (raw === null) return null;
  const name = cleanName(raw);
  return name === "" ? null : name;
}

export function normalizeExtraction(raw: Extraction, currency: CurrencyCode, now: Date = new Date()): ScanResult {
  const items = raw.problem === "none"
    ? raw.items.map(normalizeItem).filter((item): item is ScanItem => item !== null).slice(0, SCAN_ITEMS_MAX)
    : [];
  const detected = raw.currency?.trim().toUpperCase() ?? null;
  return {
    merchant: normalizeMerchant(raw.merchant),
    occurredOn: normalizeDate(raw.date, now),
    currency,
    items,
    tax: validAmount(raw.taxMinor),
    tip: validAmount(raw.tipMinor),
    discount: validAmount(raw.discountMinor),
    printedTotal: validAmount(raw.printedTotalMinor),
    flaggedCount: items.filter((item) => item.price === null).length,
    currencyMismatch: detected !== null && isCurrencyCode(detected) && detected !== currency,
  };
}
