import "server-only";
import { shiftDay } from "@/lib/calendar";
import { localDay } from "@/lib/dates";
import { cookieTimeZone } from "@/lib/time-zone";
import type { ExportWindow } from "./load";
import { spanOf, type ExportFilter } from "./rules";

const FALLBACK_ZONE = "UTC";

export interface ResolvedWindow extends ExportWindow {
  readonly today: string;
  readonly future: boolean;
}

export async function exportWindow(filter: ExportFilter): Promise<ResolvedWindow> {
  const zone = await cookieTimeZone();
  const timeZone = zone ?? FALLBACK_ZONE;
  const today = localDay(timeZone);
  const latest = zone ? today : shiftDay(today, 1);
  const span = spanOf(filter, today);
  return { span, timeZone, today, future: span !== null && (span.from > latest || span.to > latest) };
}
