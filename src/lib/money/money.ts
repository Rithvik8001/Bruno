import type { BillingCycle } from "../calendar/calendarDate";

export const fallbackCurrency = "USD";
export const maxAmountMinor = 99_999_999_999;

const maxIntegerDigits = 8;
const monthsPerYear = 12;
const weeksPerMonth = 4.348214;
const daysPerMonth = 30.4375;

const currencyPattern = /^[A-Z]{3}$/;

const zeroDecimalCurrencies: readonly string[] = [
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
];

const threeDecimalCurrencies: readonly string[] = [
  "BHD",
  "IQD",
  "JOD",
  "KWD",
  "LYD",
  "OMR",
  "TND",
];

export type FractionDigits = 0 | 2 | 3;

export function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && currencyPattern.test(value);
}

export function resolveCurrency(deviceCode: string | null | undefined): string {
  if (deviceCode === null || deviceCode === undefined) {
    return fallbackCurrency;
  }
  const candidate = deviceCode.trim().toUpperCase();
  return isCurrencyCode(candidate) ? candidate : fallbackCurrency;
}

export function fractionDigits(currency: string): FractionDigits {
  if (zeroDecimalCurrencies.includes(currency)) {
    return 0;
  }
  if (threeDecimalCurrencies.includes(currency)) {
    return 3;
  }
  return 2;
}

export function parseAmount(text: string, currency: string): number | null {
  const digits = fractionDigits(currency);
  const pattern =
    digits === 0
      ? new RegExp(`^(\\d{1,${maxIntegerDigits}})$`)
      : new RegExp(`^(\\d{1,${maxIntegerDigits}})(?:[.,](\\d{0,${digits}}))?$`);
  const match = pattern.exec(text.trim());
  if (match === null) {
    return null;
  }

  const whole = match[1] ?? "";
  const fraction = (match[2] ?? "").padEnd(digits, "0");
  const amountMinor = Number(`${whole}${fraction}`);

  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0 ||
    amountMinor > maxAmountMinor
  ) {
    return null;
  }
  return amountMinor;
}

export function toMajor(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** fractionDigits(currency);
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(
  currency: string,
  locale: string | undefined,
): Intl.NumberFormat {
  const key = `${locale ?? ""}|${currency}`;
  const cached = formatters.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const created = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  formatters.set(key, created);
  return created;
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale?: string,
): string {
  const major = toMajor(amountMinor, currency);
  try {
    return formatter(currency, locale).format(major);
  } catch {
    return `${currency} ${major.toFixed(fractionDigits(currency))}`;
  }
}

export function monthlyAmountMinor(
  amountMinor: number,
  cycle: BillingCycle,
): number {
  switch (cycle.unit) {
    case "day":
      return Math.round((amountMinor * daysPerMonth) / cycle.count);
    case "week":
      return Math.round((amountMinor * weeksPerMonth) / cycle.count);
    case "month":
      return Math.round(amountMinor / cycle.count);
    case "year":
      return Math.round(amountMinor / (cycle.count * monthsPerYear));
  }
}
