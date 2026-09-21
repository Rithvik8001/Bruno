import { toLocalDate, type CalendarDate } from "@/lib/calendar";

let ledgerDateFormat: Intl.DateTimeFormat | undefined;

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
