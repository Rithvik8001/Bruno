import type { BillingCycle, CalendarDate } from "@/lib/calendar";
import { logoUrl } from "@/lib/logos";
import { formatMoney, monthlyAmountExact } from "@/lib/money";

import { emailCopy } from "./copy";
import { mail } from "./theme";

const locale = "en-US";
const maxRows = 8;
const monthsPerYear = 12;

function utcDate(date: CalendarDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

const dateFormat = new Intl.DateTimeFormat(locale, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const shortDateFormat = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const monthFormat = new Intl.DateTimeFormat(locale, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatEmailDate(date: CalendarDate): string {
  return dateFormat.format(utcDate(date));
}

export function formatEmailShortDate(date: CalendarDate): string {
  return shortDateFormat.format(utcDate(date));
}

export function formatEmailMonth(date: CalendarDate): string {
  return monthFormat.format(utcDate(date));
}

export function formatEmailMoney(amountMinor: number, currency: string): string {
  return formatMoney(amountMinor, currency, locale);
}

export function formatRelative(days: number): string {
  if (days <= 1) {
    return emailCopy.relative.one;
  }
  if (days <= 3) {
    return emailCopy.relative.three;
  }
  return emailCopy.relative.seven;
}

export function formatPer(cycle: BillingCycle): string {
  return cycle.count === 1
    ? emailCopy.per[cycle.unit]
    : emailCopy.every
        .replace("{count}", String(cycle.count))
        .replace("{unit}", emailCopy.units[cycle.unit]);
}

export function formatCycleName(cycle: BillingCycle): string {
  return cycle.count === 1
    ? emailCopy.cycleOne[cycle.unit]
    : `${cycle.count} ${emailCopy.units[cycle.unit]}`;
}

export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

export function yearlyAmountMinor(amountMinor: number, cycle: BillingCycle): number {
  return Math.round(monthlyAmountExact(amountMinor, cycle) * monthsPerYear);
}

export function emailLogoUrl(serviceKey: string | null): string | null {
  return logoUrl(serviceKey, {
    theme: "light",
    px: mail.logo.request,
    fallback: "monogram",
  });
}

export function initial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

export function markUrl(): string {
  return `${mail.assetOrigin}${mail.markPath}`;
}

export function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export const digestMaxRows = maxRows;
