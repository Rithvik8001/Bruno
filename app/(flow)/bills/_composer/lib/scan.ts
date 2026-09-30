import type { PersonId } from "@/lib/domain/ids";
import type { Cents } from "@/lib/money";
import type { DuplicateBill } from "@/lib/scans/duplicates";
import type { ScanResult } from "@/lib/scans/result";
import { draftTotals } from "./derive";
import { emptyDraft, type BillDraft, type DraftItem } from "./draft";

export interface ScanReceipt {
  readonly merchant: string | null;
  readonly printedTotal: Cents | null;
  readonly currencyMismatch: boolean;
  readonly duplicate: DuplicateBill | null;
}

export function draftFromScan(result: ScanResult, members: readonly PersonId[], you: PersonId, today: string): BillDraft {
  const base = emptyDraft(members, you, today);
  const items: DraftItem[] = result.items.map((item, index) => ({
    key: `item-${index}`,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    category: item.category,
    hints: item.guesses.length > 0 || item.categories.length > 1 ? { guesses: item.guesses, categories: item.categories } : null,
  }));
  return {
    ...base,
    title: result.merchant ?? "",
    occurredOn: result.occurredOn ?? today,
    items,
    nextKey: items.length,
    tax: result.tax,
    tip: result.tip === null ? { mode: "none" } : { mode: "amount", amount: result.tip },
    discount: result.discount,
  };
}

export function isFlagged(item: DraftItem): boolean {
  return item.price === null && (item.hints?.guesses.length ?? 0) > 0;
}

export function flaggedCount(draft: BillDraft): number {
  return draft.items.filter(isFlagged).length;
}

export type ReceiptCheck =
  | { readonly kind: "printing" }
  | { readonly kind: "unresolved"; readonly printed: Cents | null; readonly count: number }
  | { readonly kind: "match"; readonly total: Cents }
  | { readonly kind: "off"; readonly total: Cents; readonly printed: Cents; readonly diff: Cents }
  | { readonly kind: "plain" };

export function receiptCheck(draft: BillDraft, printedTotal: Cents | null, printing: boolean): ReceiptCheck {
  if (printing) return { kind: "printing" };
  const unresolved = flaggedCount(draft);
  if (unresolved > 0) return { kind: "unresolved", printed: printedTotal, count: unresolved };
  const totals = draftTotals(draft);
  if (!totals || printedTotal === null) return { kind: "plain" };
  if (totals.total === printedTotal) return { kind: "match", total: totals.total };
  return { kind: "off", total: totals.total, printed: printedTotal, diff: Math.abs(totals.total - printedTotal) as Cents };
}
