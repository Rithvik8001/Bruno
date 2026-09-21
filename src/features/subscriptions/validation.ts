import {
  compareDates,
  isValidCalendarDate,
  type CalendarDate,
} from "@/lib/calendar";

export const nameMaxLength = 80;
export const notesMaxLength = 500;
export const paymentMethodMaxLength = 40;
export const renewalHorizonYears = 10;

const cardLikePattern = /[0-9]{7,}/;

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function isValidName(value: string): boolean {
  const name = normalizeName(value);
  return name.length >= 1 && name.length <= nameMaxLength;
}

export function isValidNotes(value: string): boolean {
  return value.trim().length <= notesMaxLength;
}

export function looksLikeCardNumber(value: string): boolean {
  return cardLikePattern.test(value);
}

export function isValidPaymentMethod(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length <= paymentMethodMaxLength && !looksLikeCardNumber(trimmed)
  );
}

export function renewalHorizon(today: CalendarDate): CalendarDate {
  return { ...today, year: today.year + renewalHorizonYears, day: 1 };
}

export function isValidRenewalDate(
  date: CalendarDate,
  today: CalendarDate,
): boolean {
  return (
    isValidCalendarDate(date) &&
    compareDates(date, today) >= 0 &&
    compareDates(date, renewalHorizon(today)) <= 0
  );
}
