import { monthOf, shiftDay, shiftMonth, type MonthView } from "@/lib/calendar";
import type { GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const EXPORT_KINDS = ["bills", "items", "payments"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export const EXPORT_RANGES = ["all", "year", "lastMonth", "custom"] as const;
export type ExportRange = (typeof EXPORT_RANGES)[number];

export const ALL_GROUPS = "all";
export const BIG_ROWS = 3000;
export const MAX_ROWS = 50_000;

export type ExportCounts = Readonly<Record<ExportKind, number>>;

export const NO_COUNTS: ExportCounts = { bills: 0, items: 0, payments: 0 };

export interface DaySpan {
  readonly from: string;
  readonly to: string;
}

export interface ExportFilter {
  readonly group: string;
  readonly range: ExportRange;
  readonly from?: string;
  readonly to?: string;
}

export interface ExportRequest extends ExportFilter {
  readonly kinds: readonly ExportKind[];
}

export interface ExportGroup {
  readonly id: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly people: number;
  readonly counts: ExportCounts;
}

export interface ExportPreview {
  readonly counts: ExportCounts;
  readonly groups: number;
}

export const EXPORT_HEADERS = { name: "x-export-name", rows: "x-export-rows", files: "x-export-files" } as const;

const pad = (n: number) => String(n).padStart(2, "0");
const firstOf = (view: MonthView) => `${view.year}-${pad(view.month + 1)}-01`;

export function spanOf(filter: Pick<ExportFilter, "range" | "from" | "to">, today: string): DaySpan | null {
  switch (filter.range) {
    case "all":
      return null;
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case "lastMonth": {
      const thisMonth = monthOf(today);
      return { from: firstOf(shiftMonth(thisMonth, -1)), to: shiftDay(firstOf(thisMonth), -1) };
    }
    case "custom":
      return { from: filter.from ?? today, to: filter.to ?? today };
  }
}

export function countRows(counts: ExportCounts, kinds: readonly ExportKind[]): number {
  return kinds.reduce((sum, kind) => sum + counts[kind], 0);
}

export function addCounts(a: ExportCounts, b: ExportCounts): ExportCounts {
  return { bills: a.bills + b.bills, items: a.items + b.items, payments: a.payments + b.payments };
}
