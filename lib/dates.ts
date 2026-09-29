const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 6;

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const weekdayDayMonth = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const clock = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

export const dayWords = { today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow" } as const;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function calendarDay(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function daysAgo(date: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
}

export function shortDay(date: Date, now: Date): string {
  const day = calendarDay(date);
  const ago = daysAgo(day, now);
  if (ago === 0) return dayWords.today;
  if (ago === 1) return dayWords.yesterday;
  if (ago > 1 && ago <= WEEK_DAYS) return weekday.format(day);
  return day.getFullYear() === now.getFullYear() ? dayMonth.format(day) : dayMonthYear.format(day);
}

export function longDay(date: Date, now: Date): string {
  const day = calendarDay(date);
  const ago = daysAgo(day, now);
  if (ago === 0) return dayWords.today;
  if (ago === 1) return dayWords.yesterday;
  return day.getFullYear() === now.getFullYear() ? weekdayDayMonth.format(day) : dayMonthYear.format(day);
}

export function momentLabel(date: Date, now: Date): string {
  const ago = daysAgo(date, now);
  if (ago === 0) return clockTime(date);
  if (ago === 1) return dayWords.yesterday;
  if (ago > 1 && ago <= WEEK_DAYS) return weekday.format(date);
  return date.getFullYear() === now.getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date);
}

export function relativeDay(date: Date, now: Date): string {
  const diff = daysAgo(date, now);
  if (diff === 0) return dayWords.today;
  if (diff === 1) return dayWords.yesterday;
  if (diff === -1) return dayWords.tomorrow;
  if (Math.abs(diff) <= WEEK_DAYS) return weekday.format(date);
  return date.getFullYear() === now.getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date);
}

export function inlineDay(date: Date, now: Date): string {
  const label = relativeDay(date, now);
  return (Object.values(dayWords) as string[]).includes(label) ? label.toLowerCase() : `on ${label}`;
}

export function clockTime(date: Date): string {
  return clock.format(date).replace(/\s/g, " ");
}
