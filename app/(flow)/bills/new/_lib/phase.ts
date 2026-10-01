import type { GhostLine, ScanLine, ScanRow } from "@/components/patterns/receipt-scan";
import type { ScanSummary } from "@/lib/scans/actions";
import type { ScanQuota } from "@/lib/scans/quota";

export type ScanPhase =
  | { readonly kind: "idle" }
  | { readonly kind: "uploading"; readonly scanId: string; readonly fraction: number }
  | { readonly kind: "extracting"; readonly scanId: string }
  | { readonly kind: "revealing"; readonly summary: ScanSummary }
  | { readonly kind: "done"; readonly summary: ScanSummary }
  | { readonly kind: "failed"; readonly reason: string | null };

export const UPLOAD_UNTIL = 12;
export const EXTRACT_UNTIL = 70;
export const GHOST_COUNT = 5;
export const EXTRACT_CREEP = { steps: 29, stepMs: 800 } as const;
export const REVEAL = { steps: 22, stepMs: 64 } as const;

const GHOST_WIDTHS = ["62%", "48%", "70%", "54%", "78%"] as const satisfies readonly `${number}%`[];

export function ghostLines(count = GHOST_COUNT): GhostLine[] {
  return Array.from({ length: count }, (_, i) => ({ id: `ghost-${i}`, ghostWidth: GHOST_WIDTHS[i % GHOST_WIDTHS.length] ?? "60%" }));
}

export function uploadProgress(fraction: number): number {
  return Math.round(Math.min(1, Math.max(0, fraction)) * UPLOAD_UNTIL);
}

export function extractProgress(timeline: number | null): number {
  if (timeline === null) return UPLOAD_UNTIL;
  return UPLOAD_UNTIL + Math.round((timeline / 100) * (EXTRACT_UNTIL - UPLOAD_UNTIL));
}

export function revealProgress(timeline: number | null): number {
  return timeline === null ? UPLOAD_UNTIL : UPLOAD_UNTIL + Math.round((timeline / 100) * (100 - UPLOAD_UNTIL));
}

export function previewRows(lines: readonly ScanLine[]): { rows: ScanRow[]; overflow: number } {
  const rows = lines.slice(0, GHOST_COUNT);
  const ghosts = ghostLines(GHOST_COUNT - rows.length).slice(0);
  return { rows: rows.length > 0 ? rows : ghosts, overflow: Math.max(0, lines.length - rows.length) };
}

export function quotaExhausted(quota: ScanQuota): boolean {
  return quota.left <= 0;
}
