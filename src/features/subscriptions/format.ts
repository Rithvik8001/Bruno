import {
  daysBetween,
  toLocalDate,
  type BillingCycle,
  type CalendarDate,
} from "@/lib/calendar";

import { subscriptionsCopy } from "./copy";

let ledgerDateFormat: Intl.DateTimeFormat | undefined;
let longDateFormat: Intl.DateTimeFormat | undefined;
let monthFormat: Intl.DateTimeFormat | undefined;
let monthYearFormat: Intl.DateTimeFormat | undefined;
let weekdayDateFormat: Intl.DateTimeFormat | undefined;

export function formatMonth(date: CalendarDate): string {
  const local = toLocalDate(date);
  try {
    monthFormat ??= new Intl.DateTimeFormat(undefined, { month: "long" });
    return monthFormat.format(local);
  } catch {
    return String(date.month);
  }
}

export function formatMonthYear(date: CalendarDate): string {
  const local = toLocalDate(date);
  try {
    monthYearFormat ??= new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    });
    return monthYearFormat.format(local);
  } catch {
    return `${date.month}/${date.year}`;
  }
}

export function formatWeekdayDate(date: CalendarDate): string {
  const local = toLocalDate(date);
  try {
    weekdayDateFormat ??= new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return weekdayDateFormat.format(local);
  } catch {
    return `${date.month}/${date.day}`;
  }
}

export function formatLongDate(date: CalendarDate): string {
  const local = toLocalDate(date);
  try {
    longDateFormat ??= new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return longDateFormat.format(local);
  } catch {
    return `${date.year}-${date.month}-${date.day}`;
  }
}

export function formatLedgerDate(date: CalendarDate): string {
  const local = toLocalDate(date);
  try {
    ledgerDateFormat ??= new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
    });
    return ledgerDateFormat.format(local);
  } catch {
    return `${date.month}/${date.day}`;
  }
}

export function formatCycle(cycle: BillingCycle): string {
  return cycle.count === 1
    ? subscriptionsCopy.cycleUnits.one[cycle.unit]
    : `${cycle.count} ${subscriptionsCopy.cycleUnits.many[cycle.unit]}`;
}

export function formatRelativeDay(
  date: CalendarDate,
  today: CalendarDate,
): string {
  const days = daysBetween(today, date);
  if (days <= 0) {
    return subscriptionsCopy.relative.today;
  }
  if (days === 1) {
    return subscriptionsCopy.relative.tomorrow;
  }
  return subscriptionsCopy.relative.inDays.replace("{days}", String(days));
}

export function formatCycleAdverb(cycle: BillingCycle): string {
  return cycle.count === 1
    ? subscriptionsCopy.cycleAdverb[cycle.unit]
    : subscriptionsCopy.every.replace("{cycle}", formatCycle(cycle).toLowerCase());
}

export function formatPer(cycle: BillingCycle): string {
  return cycle.count === 1
    ? subscriptionsCopy.per[cycle.unit]
    : subscriptionsCopy.every.replace("{cycle}", formatCycle(cycle).toLowerCase());
}
