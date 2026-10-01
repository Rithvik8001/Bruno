const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const asDate = (day: string) => new Date(`${day}T12:00:00.000Z`);

export function dayDate(day: string): Date {
  return asDate(day);
}

export function monthLabel(month: string, short = false): string {
  const date = asDate(`${month}-01`);
  return (short ? monthShort : monthName).format(date);
}

export function periodLabel(from: string | null, to: string | null): string | null {
  if (from === null && to === null) return null;
  if (from !== null && to !== null) {
    if (from.slice(0, 7) === to.slice(0, 7) && from.endsWith("-01")) return `in ${monthLabel(from.slice(0, 7))}`;
    return `${dayMonth.format(asDate(from))} to ${dayMonth.format(asDate(to))}`;
  }
  if (from !== null) return `since ${dayMonth.format(asDate(from))}`;
  return to === null ? null : `up to ${dayMonth.format(asDate(to))}`;
}
