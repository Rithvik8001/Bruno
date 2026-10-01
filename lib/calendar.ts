const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK = 7;

const pad = (n: number) => String(n).padStart(2, "0");
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const weekdayDayMonth = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export interface MonthView {
  readonly year: number;
  readonly month: number;
}

export interface DayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly future: boolean;
  readonly today: boolean;
}

export function parseIsoDay(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function shiftDay(iso: string, days: number): string {
  const date = parseIsoDay(iso);
  return date ? isoDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)) : iso;
}

export function monthOf(iso: string): MonthView {
  const date = parseIsoDay(iso) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function shiftMonth(view: MonthView, by: number): MonthView {
  const index = view.year * 12 + view.month + by;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

export function isLatestMonth(view: MonthView, todayIso: string): boolean {
  const today = monthOf(todayIso);
  return view.year * 12 + view.month >= today.year * 12 + today.month;
}

export function monthTitle(view: MonthView): string {
  return monthYear.format(new Date(view.year, view.month, 1));
}

export function monthCells(view: MonthView, todayIso: string): DayCell[] {
  const offset = (new Date(view.year, view.month, 1).getDay() + WEEK - 1) % WEEK;
  const days = new Date(view.year, view.month + 1, 0).getDate();
  const count = Math.ceil((offset + days) / WEEK) * WEEK;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(view.year, view.month, 1 - offset + index);
    const iso = isoDay(date);
    return { iso, day: date.getDate(), inMonth: date.getMonth() === view.month, future: iso > todayIso, today: iso === todayIso };
  });
}

export function pickerLabel(iso: string, todayIso: string, words: { readonly today: string; readonly yesterday: string }): string {
  const date = parseIsoDay(iso);
  const today = parseIsoDay(todayIso);
  if (!date || !today) return iso;
  const ago = Math.round((today.getTime() - date.getTime()) / DAY_MS);
  if (ago === 0) return `${words.today}, ${dayMonth.format(date)}`;
  if (ago === 1) return `${words.yesterday}, ${dayMonth.format(date)}`;
  return date.getFullYear() === today.getFullYear() ? weekdayDayMonth.format(date) : dayMonthYear.format(date);
}
