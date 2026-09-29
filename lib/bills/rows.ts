import { lineItemId, personId } from "@/lib/domain/ids";
import { cents } from "@/lib/money";
import type { BillInput, SplitMethod, Tip } from "./types";

export interface TipRow {
  readonly tipKind: "NONE" | "PERCENT" | "AMOUNT";
  readonly tipValue: number;
}

export interface BillSplitRow extends TipRow {
  readonly splitMethod: SplitMethod;
  readonly taxCents: number;
  readonly discountCents: number;
  readonly items: readonly { readonly id: string; readonly priceCents: number; readonly claims: readonly { readonly personId: string }[] }[];
  readonly participants: readonly {
    readonly personId: string;
    readonly shares: number;
    readonly percentBps: number | null;
    readonly amountCents: number | null;
  }[];
}

export const billSplitSelect = {
  splitMethod: true,
  taxCents: true,
  tipKind: true,
  tipValue: true,
  discountCents: true,
  items: {
    orderBy: { position: "asc" },
    select: { id: true, priceCents: true, claims: { select: { personId: true } } },
  },
  participants: { select: { personId: true, shares: true, percentBps: true, amountCents: true } },
} as const;

export function tipFromRow({ tipKind, tipValue }: TipRow): Tip {
  switch (tipKind) {
    case "NONE":
      return { kind: "NONE" };
    case "PERCENT":
      return { kind: "PERCENT", bps: tipValue };
    case "AMOUNT":
      return { kind: "AMOUNT", amount: cents(tipValue) };
  }
}

export function billInputFromRow(row: BillSplitRow): BillInput {
  return {
    method: row.splitMethod,
    taxCents: cents(row.taxCents),
    tip: tipFromRow(row),
    discountCents: cents(row.discountCents),
    items: row.items.map((item) => ({
      id: lineItemId(item.id),
      priceCents: cents(item.priceCents),
      claimedBy: item.claims.map((c) => personId(c.personId)),
    })),
    participants: row.participants.map((p) => ({
      personId: personId(p.personId),
      shares: p.shares,
      percentBps: p.percentBps,
      amountCents: p.amountCents === null ? null : cents(p.amountCents),
    })),
  };
}
