import { z } from "zod";
import { cents, type Cents, type SignDisplay } from "./money";

export const currencies = {
  USD: { symbol: "$", minorUnits: 2 },
  EUR: { symbol: "€", minorUnits: 2 },
  GBP: { symbol: "£", minorUnits: 2 },
  CAD: { symbol: "$", minorUnits: 2 },
  AUD: { symbol: "$", minorUnits: 2 },
  INR: { symbol: "₹", minorUnits: 2 },
  CHF: { symbol: "CHF", minorUnits: 2 },
  MXN: { symbol: "$", minorUnits: 2 },
  JPY: { symbol: "¥", minorUnits: 0 },
  KRW: { symbol: "₩", minorUnits: 0 },
} as const satisfies Record<string, { symbol: string; minorUnits: number }>;

export type CurrencyCode = keyof typeof currencies;

export const CURRENCY_CODES = Object.keys(currencies) as readonly CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const currencyNames = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  CAD: "Canadian dollar",
  AUD: "Australian dollar",
  INR: "Indian rupee",
  CHF: "Swiss franc",
  MXN: "Mexican peso",
  JPY: "Japanese yen",
  KRW: "South Korean won",
} as const satisfies Record<CurrencyCode, string>;

export const currencyOptions = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${currencyNames[code]} · ${currencies[code].symbol}`,
}));

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in currencies;
}

export const currencyCodeSchema = z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]);

const MINUS = "−";
const MAX_AMOUNT_DIGITS = 9;
const AMOUNT_TEXT = /^\d*(?:\.\d*)?$/;

export function currencySymbol(code: CurrencyCode): string {
  return currencies[code].symbol;
}

export function minorUnitsOf(code: CurrencyCode): number {
  return currencies[code].minorUnits;
}

function groupThousands(whole: number): string {
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatAmount(value: Cents, code: CurrencyCode, sign: SignDisplay = "auto"): string {
  const minorUnits = minorUnitsOf(code);
  const scale = 10 ** minorUnits;
  const abs = Math.abs(value);
  const whole = groupThousands(Math.trunc(abs / scale));
  const body = minorUnits === 0 ? whole : `${whole}.${String(abs % scale).padStart(minorUnits, "0")}`;
  if (sign === "never" || value === 0) return body;
  if (value < 0) return `${MINUS}${body}`;
  return sign === "always" ? `+${body}` : body;
}

export function formatMoney(value: Cents, code: CurrencyCode): string {
  const body = formatAmount(value, code, "never");
  return value < 0 ? `${MINUS}${currencySymbol(code)}${body}` : `${currencySymbol(code)}${body}`;
}

export function isAmountText(text: string, code: CurrencyCode): boolean {
  const cleaned = text.replace(/,/g, "");
  if (!AMOUNT_TEXT.test(cleaned)) return false;
  const fraction = cleaned.split(".")[1];
  if (fraction === undefined) return true;
  return minorUnitsOf(code) > 0 && fraction.length <= minorUnitsOf(code);
}

export function parseAmount(text: string, code: CurrencyCode): Cents | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (cleaned === "" || cleaned === "." || !isAmountText(cleaned, code)) return null;
  const [whole = "", fraction = ""] = cleaned.split(".");
  const digits = `${whole}${fraction.padEnd(minorUnitsOf(code), "0")}`.replace(/^0+(?=\d)/, "");
  if (digits.length > MAX_AMOUNT_DIGITS) return null;
  return cents(Number(digits));
}
