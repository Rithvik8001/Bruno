import {
  toLocalDate,
  type BillingCycle,
  type CalendarDate,
} from "@/lib/calendar";

import { subscriptionsCopy } from "./copy";

let ledgerDateFormat: Intl.DateTimeFormat | undefined;
let longDateFormat: Intl.DateTimeFormat | undefined;

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
