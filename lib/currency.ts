import { z } from "zod";

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

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in currencies;
}

export const currencyCodeSchema = z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]);
