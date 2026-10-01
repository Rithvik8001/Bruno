import type { EmailPerson } from "@/emails/_components/blocks";
import { initialsOf } from "@/components/ui/avatar";
import { parseTint } from "@/lib/people/defaults";

const FALLBACK_ZONE = "UTC";

function formatter(timeZone: string | null, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: timeZone ?? FALLBACK_ZONE });
  } catch {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: FALLBACK_ZONE });
  }
}

export function emailDay(date: Date, timeZone: string | null): string {
  return formatter(timeZone, { day: "numeric", month: "short" }).format(date);
}

export function emailMoment(date: Date, timeZone: string | null): string {
  const suffix = timeZone ? "" : " UTC";
  return `${formatter(timeZone, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}${suffix}`;
}

export function billDayLabel(occurredAt: Date): string {
  return emailDay(occurredAt, FALLBACK_ZONE);
}

export function emailPerson(person: { readonly displayName: string; readonly tint: string }): EmailPerson {
  return { initials: initialsOf(person.displayName), tint: parseTint(person.tint, person.displayName) };
}
