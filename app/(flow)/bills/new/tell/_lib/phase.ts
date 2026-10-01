import type { PersonView } from "@/lib/people/person";
import type { Cents } from "@/lib/money";
import type { TellDrafted } from "@/lib/tell/actions";
import type { TellResult } from "@/lib/tell/result";

export type TellFailureKind = "vague" | "network";

export type TellPhase =
  | { readonly kind: "compose"; readonly failure: TellFailureKind | null }
  | { readonly kind: "working" }
  | { readonly kind: "revealing"; readonly drafted: TellDrafted }
  | { readonly kind: "clarify"; readonly drafted: TellDrafted };

export const TELL_CREEP = { steps: 24, stepMs: 380 } as const;
export const TELL_REVEAL = { steps: 14, stepMs: 70 } as const;
export const REVEAL_HOLD_MS = 650;
export const GHOST_WIDTHS = ["58%", "72%", "48%"] as const satisfies readonly `${number}%`[];
export const PREVIEW_MAX = 4;
const TOTAL_AT = 80;

export interface SaidChunk {
  readonly text: string;
  readonly separator: string;
}

export function chunksOf(text: string): SaidChunk[] {
  const parts = text.split(/(\s*[,;.]\s+)/);
  const chunks: SaidChunk[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const body = parts[i] ?? "";
    if (body.trim() === "") continue;
    chunks.push({ text: body, separator: parts[i + 1] ?? "" });
  }
  return chunks.length > 0 ? chunks : [{ text, separator: "" }];
}

export type ChunkState = "idle" | "now" | "done";

export function chunkState(index: number, count: number, creep: number | null, settled: boolean): ChunkState {
  if (settled) return "done";
  if (creep === null) return "idle";
  const from = (index / count) * 100;
  const until = ((index + 1) / count) * 100;
  return creep >= until ? "done" : creep >= from ? "now" : "idle";
}

export type CreepStage = "reading" | "paying" | "matching" | "splitting";

export function creepStage(creep: number | null): CreepStage {
  const p = creep ?? 0;
  return p < 25 ? "reading" : p < 50 ? "paying" : p < 75 ? "matching" : "splitting";
}

export interface PreviewLine {
  readonly id: string;
  readonly name: string;
  readonly price: Cents | null;
  readonly people: readonly PersonView[];
}

export function previewLines(result: TellResult, members: readonly PersonView[]): PreviewLine[] {
  const byId = new Map<string, PersonView>(members.map((m) => [m.id, m]));
  const priced = result.items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  return result.items.slice(0, PREVIEW_MAX).map((item, index) => {
    const people = item.everyone
      ? members
      : item.claimants.flatMap((person) => {
          const ids = result.people[person]?.memberIds ?? [];
          const only = ids.length === 1 ? ids[0] : undefined;
          const found = only === undefined ? undefined : byId.get(only);
          return found ? [found] : [];
        });
    const rest = item.rest && result.stated !== null ? Math.max(0, result.stated - priced) : null;
    return {
      id: `line-${index}`,
      name: item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name,
      price: item.price ?? (rest !== null && rest > 0 ? (rest as Cents) : null),
      people,
    };
  });
}

export function previewTotal(result: TellResult): Cents | null {
  if (result.stated !== null) return result.stated;
  const priced = result.items.filter((item) => item.price !== null);
  if (priced.length === 0) return null;
  return priced.reduce((sum, item) => sum + (item.price ?? 0), 0) as Cents;
}

export function lineShown(index: number, count: number, reveal: number | null): boolean {
  if (reveal === null) return false;
  return reveal >= ((index + 1) / (count + 1)) * TOTAL_AT;
}

export function totalShown(reveal: number | null): boolean {
  return reveal !== null && reveal >= TOTAL_AT;
}
