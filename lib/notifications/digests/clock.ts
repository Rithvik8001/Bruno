const FALLBACK_ZONE = "UTC";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DIGEST_HOUR = 9;
export const WEEKLY_WEEKDAY = 0;
export const MONTHLY_DAY = 1;

export interface LocalClock {
  readonly date: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: number;
  readonly hour: number;
}

export interface MonthRef {
  readonly key: string;
  readonly label: string;
}

function partsIn(timeZone: string, now: Date): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
}

export function localClock(timeZone: string | null, now: Date): LocalClock {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = partsIn(timeZone ?? FALLBACK_ZONE, now);
  } catch {
    parts = partsIn(FALLBACK_ZONE, now);
  }
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(read("year"));
  const month = Number(read("month"));
  const day = Number(read("day"));
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    year,
    month,
    day,
    weekday: WEEKDAYS.indexOf(read("weekday") as (typeof WEEKDAYS)[number]),
    hour: Number(read("hour")),
  };
}

export function weeklyDue(clock: LocalClock): boolean {
  return clock.weekday === WEEKLY_WEEKDAY && clock.hour >= DIGEST_HOUR;
}

export function monthlyDue(clock: LocalClock): boolean {
  return clock.day === MONTHLY_DAY && clock.hour >= DIGEST_HOUR;
}

export function monthKeyOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function previousMonth(clock: LocalClock): MonthRef {
  const year = clock.month === 1 ? clock.year - 1 : clock.year;
  const month = clock.month === 1 ? 12 : clock.month - 1;
  return { key: monthKeyOf(year, month), label: MONTHS[month - 1] ?? "" };
}

export function monthKeyIn(timeZone: string | null, date: Date): string {
  const clock = localClock(timeZone, date);
  return monthKeyOf(clock.year, clock.month);
}
