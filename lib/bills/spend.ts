import type { LineItemId } from "@/lib/domain/ids";
import { allocate, cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { bucketOf, type SpendBucket } from "./buckets";
import type { ItemCategory, PersonShare, SplitMethod } from "./types";

export interface SpendItem {
  readonly id: LineItemId;
  readonly priceCents: Cents;
  readonly category: ItemCategory | null;
}

export interface SpendLine {
  readonly lineItemId: LineItemId | null;
  readonly bucket: SpendBucket;
  readonly tagged: boolean;
  readonly amount: Cents;
}

function spread(total: Cents, weights: readonly number[]): Cents[] {
  if (weights.length === 0) return [];
  const safe = weights.some((w) => w > 0) ? weights : weights.map(() => 1);
  return allocate(total, safe);
}

export function spendLines(items: readonly SpendItem[], share: PersonShare, method: SplitMethod): SpendLine[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const base =
    method === "ITEMS"
      ? share.lines.flatMap((line) => {
          const item = byId.get(line.lineItemId);
          return item ? [{ item, weight: line.amount as number }] : [];
        })
      : items.map((item) => ({ item, weight: item.priceCents as number }));
  if (base.length === 0) return share.total > 0 ? [{ lineItemId: null, bucket: "OTHER", tagged: false, amount: share.total }] : [];
  const amounts = spread(
    share.total,
    base.map((entry) => Math.max(0, entry.weight)),
  );
  return base.map((entry, index) => ({
    lineItemId: entry.item.id,
    bucket: bucketOf(entry.item.category),
    tagged: entry.item.category !== null,
    amount: amounts[index] ?? ZERO_CENTS,
  }));
}

export function bucketTotals(lines: readonly SpendLine[]): ReadonlyMap<SpendBucket, Cents> {
  const totals = new Map<SpendBucket, Cents>();
  for (const line of lines) totals.set(line.bucket, cents((totals.get(line.bucket) ?? ZERO_CENTS) + line.amount));
  return totals;
}
