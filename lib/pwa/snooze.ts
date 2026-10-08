const PREFIX = "bruno-snooze:";
const DAY_MS = 24 * 60 * 60 * 1000;
export const SNOOZE_DAYS = 30;

export type SnoozeKey = "installCard" | "optIn:claim" | "optIn:split" | "optIn:confirm";

export function isSnoozed(key: SnoozeKey, now: number = Date.now()): boolean {
  try {
    const until = Number(window.localStorage.getItem(PREFIX + key));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

export function snooze(key: SnoozeKey, days: number = SNOOZE_DAYS, now: number = Date.now()): void {
  try {
    window.localStorage.setItem(PREFIX + key, String(now + days * DAY_MS));
  } catch {}
}
