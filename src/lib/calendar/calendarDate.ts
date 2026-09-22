export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export const cycleUnits = ["day", "week", "month", "year"] as const;

export type CycleUnit = (typeof cycleUnits)[number];

export type BillingCycle = {
  unit: CycleUnit;
  count: number;
};

const dbDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const msPerDay = 86_400_000;
const daysPerWeek = 7;
const monthsPerYear = 12;
const localNoonHour = 12;
const minYear = 1900;
const maxYear = 9999;

export function isCycleUnit(value: unknown): value is CycleUnit {
  return (
    typeof value === "string" &&
    (cycleUnits as readonly string[]).includes(value)
  );
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidCalendarDate(date: CalendarDate): boolean {
  return (
    Number.isInteger(date.year) &&
    Number.isInteger(date.month) &&
    Number.isInteger(date.day) &&
    date.year >= minYear &&
    date.year <= maxYear &&
    date.month >= 1 &&
    date.month <= monthsPerYear &&
    date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );
}

export function parseDbDate(value: string): CalendarDate | null {
  const match = dbDatePattern.exec(value);
  if (match === null) {
    return null;
  }
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isValidCalendarDate(date) ? date : null;
}

export function toDbDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, "0");
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromLocalDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function toLocalDate(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day, localNoonHour);
}

export function today(now: Date = new Date()): CalendarDate {
  return fromLocalDate(now);
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  if (a.month !== b.month) {
    return a.month - b.month;
  }
  return a.day - b.day;
}

function toEpochDay(date: CalendarDate): number {
  return Math.round(Date.UTC(date.year, date.month - 1, date.day) / msPerDay);
}

function fromEpochDay(epochDay: number): CalendarDate {
  const date = new Date(epochDay * msPerDay);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function monthIndex(date: CalendarDate): number {
  return date.year * monthsPerYear + (date.month - 1);
}

function stepDays(cycle: BillingCycle): number {
  return cycle.count * (cycle.unit === "week" ? daysPerWeek : 1);
}

function stepMonths(cycle: BillingCycle): number {
  return cycle.count * (cycle.unit === "year" ? monthsPerYear : 1);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days);
}

export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

export function addCycles(
  anchor: CalendarDate,
  cycle: BillingCycle,
  k: number,
): CalendarDate {
  if (cycle.unit === "day" || cycle.unit === "week") {
    return addDays(anchor, k * stepDays(cycle));
  }

  const total = monthIndex(anchor) + k * stepMonths(cycle);
  const year = Math.floor(total / monthsPerYear);
  const month = (total % monthsPerYear) + 1;
  return {
    year,
    month,
    day: Math.min(anchor.day, daysInMonth(year, month)),
  };
}

export function nextRenewal(
  anchor: CalendarDate,
  cycle: BillingCycle,
  from: CalendarDate,
): CalendarDate {
  if (compareDates(anchor, from) >= 0) {
    return anchor;
  }

  if (cycle.unit === "day" || cycle.unit === "week") {
    const elapsed = toEpochDay(from) - toEpochDay(anchor);
    return addCycles(anchor, cycle, Math.ceil(elapsed / stepDays(cycle)));
  }

  const elapsedMonths = monthIndex(from) - monthIndex(anchor);
  const k = Math.floor(elapsedMonths / stepMonths(cycle));
  const candidate = addCycles(anchor, cycle, k);
  return compareDates(candidate, from) >= 0
    ? candidate
    : addCycles(anchor, cycle, k + 1);
}

export function isInTrial(
  trialEndsOn: CalendarDate | null,
  from: CalendarDate,
): boolean {
  return trialEndsOn !== null && compareDates(trialEndsOn, from) > 0;
}
