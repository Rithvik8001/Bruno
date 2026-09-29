import { tipOf, toBillInput } from "@/lib/bills/input";
import type { BillTipValue, CreateBillInput } from "@/lib/bills/schema";
import { computeShares } from "@/lib/bills/split";
import { billTotals } from "@/lib/bills/totals";
import { FULL_PERCENT_BPS, type BillCharges, type BillTotals } from "@/lib/bills/types";
import type { PersonId } from "@/lib/domain/ids";
import { allocate, cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { claimantsOf, includedIds, personIn, type BillDraft, type DraftItem } from "./draft";

export type FlowMode = "items" | "split";

const BPS_PER_PERCENT = FULL_PERCENT_BPS / 100;

export function filledItems(draft: BillDraft): DraftItem[] {
  return draft.items.filter((item) => item.name.trim() !== "" || item.price !== null);
}

export function tipValue(draft: BillDraft): BillTipValue {
  switch (draft.tip.mode) {
    case "none":
      return { kind: "NONE" };
    case "percent":
      return { kind: "PERCENT", bps: draft.tip.percent * BPS_PER_PERCENT };
    case "amount":
      return draft.tip.amount === null || draft.tip.amount === 0
        ? { kind: "NONE" }
        : { kind: "AMOUNT", cents: draft.tip.amount };
  }
}

function charges(draft: BillDraft): BillCharges {
  return {
    taxCents: draft.tax ?? ZERO_CENTS,
    tip: tipOf(tipValue(draft)),
    discountCents: draft.discount ?? ZERO_CENTS,
  };
}

export function subtotalOf(draft: BillDraft): Cents {
  return sumCents(filledItems(draft).map((item) => item.price ?? ZERO_CENTS));
}

export function draftTotals(draft: BillDraft): BillTotals | null {
  const totals = billTotals(
    filledItems(draft).map((item) => item.price ?? ZERO_CENTS),
    charges(draft),
  );
  return totals.ok ? totals.value : null;
}

export type ItemsIssue = "noItems" | "unnamed" | "discount" | "noTitle";

export interface ItemsCheck {
  readonly issue: ItemsIssue | null;
  readonly unnamed: number;
}

export function itemsCheck(draft: BillDraft): ItemsCheck {
  const items = filledItems(draft);
  const unnamed = items.filter((item) => item.name.trim() === "").length;
  const issue: ItemsIssue | null = !items.some((item) => item.price !== null && item.price > 0)
    ? "noItems"
    : unnamed > 0
      ? "unnamed"
      : draftTotals(draft) === null
        ? "discount"
        : draft.title.trim() === ""
          ? "noTitle"
          : null;
  return { issue, unnamed };
}

export function toCreateInput(draft: BillDraft, groupId: string, members: readonly PersonId[], mode: FlowMode): CreateBillInput {
  const byItems = mode === "items";
  return {
    groupId,
    title: draft.title,
    occurredOn: draft.occurredOn,
    payerId: draft.payerId,
    items: filledItems(draft).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      priceCents: item.price ?? ZERO_CENTS,
      claimedBy: byItems ? [...claimantsOf(draft, item.key)] : [],
    })),
    taxCents: draft.tax ?? ZERO_CENTS,
    tip: tipValue(draft),
    discountCents: draft.discount ?? ZERO_CENTS,
    method: byItems ? "ITEMS" : draft.method,
    participants: byItems
      ? []
      : includedIds(draft, members).map((id) => {
          const p = personIn(draft, id);
          return {
            personId: id,
            shares: p.shares,
            percentBps: p.percent === null ? null : p.percent * BPS_PER_PERCENT,
            amountCents: p.amount,
          };
        }),
  };
}

function previewInput(draft: BillDraft, members: readonly PersonId[], mode: FlowMode) {
  return toBillInput(toCreateInput(draft, "", members, mode));
}

export interface ClaimLine {
  readonly key: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents;
  readonly claimants: readonly PersonId[];
  readonly each: Cents | null;
}

export interface ClaimView {
  readonly lines: readonly ClaimLine[];
  readonly claimed: number;
  readonly unclaimedKeys: readonly string[];
  readonly unclaimedTotal: Cents;
  readonly extras: Cents;
  readonly ready: boolean;
  readonly shareOf: (person: PersonId) => { readonly total: Cents; readonly extras: Cents };
}

export function claimView(draft: BillDraft, members: readonly PersonId[]): ClaimView {
  const totals = draftTotals(draft);
  const lines: ClaimLine[] = filledItems(draft).map((item) => {
    const claimants = claimantsOf(draft, item.key);
    const price = item.price ?? ZERO_CENTS;
    return {
      key: item.key,
      name: item.name,
      quantity: item.quantity,
      price,
      claimants,
      each: claimants.length > 1 ? cents(Math.round(price / claimants.length)) : null,
    };
  });
  const unclaimed = lines.filter((line) => line.claimants.length === 0 && line.price > 0);
  const extras = totals ? cents(totals.tax + totals.tip - totals.discount) : ZERO_CENTS;
  const split = computeShares(previewInput(draft, members, "items"));

  const shareOf = (person: PersonId) => {
    if (split.ok) {
      const share = split.value.shares.get(person);
      return share
        ? { total: share.total, extras: cents(share.tax + share.tip - share.discount) }
        : { total: ZERO_CENTS, extras: ZERO_CENTS };
    }
    const items = sumCents(
      lines.map((line) => {
        const index = line.claimants.indexOf(person);
        if (index < 0) return ZERO_CENTS;
        return allocate(line.price, line.claimants.map(() => 1))[index] ?? ZERO_CENTS;
      }),
    );
    const subtotal = totals?.subtotal ?? ZERO_CENTS;
    const mine = subtotal > 0 ? cents(Math.round((extras * items) / subtotal)) : ZERO_CENTS;
    return { total: cents(items + mine), extras: mine };
  };

  return {
    lines,
    claimed: lines.filter((line) => line.claimants.length > 0).length,
    unclaimedKeys: unclaimed.map((line) => line.key),
    unclaimedTotal: sumCents(unclaimed.map((line) => line.price)),
    extras,
    ready: split.ok,
    shareOf,
  };
}

export type SplitCheck =
  | { readonly kind: "ok" }
  | { readonly kind: "nobody" }
  | { readonly kind: "percent"; readonly assigned: number }
  | { readonly kind: "amount"; readonly difference: Cents };

export interface SplitView {
  readonly total: Cents;
  readonly totals: ReadonlyMap<PersonId, Cents>;
  readonly assigned: Cents;
  readonly included: number;
  readonly check: SplitCheck;
}

export function splitView(draft: BillDraft, members: readonly PersonId[]): SplitView {
  const total = draftTotals(draft)?.total ?? ZERO_CENTS;
  const included = includedIds(draft, members);
  const split = computeShares(previewInput(draft, members, "split"));

  if (split.ok) {
    const totals = new Map(included.map((id) => [id, split.value.shares.get(id)?.total ?? ZERO_CENTS]));
    return { total, totals, assigned: total, included: included.length, check: { kind: "ok" } };
  }

  if (draft.method === "PERCENT") {
    const totals = new Map(
      included.map((id) => [id, cents(Math.round((total * (personIn(draft, id).percent ?? 0)) / 100))]),
    );
    const assigned = included.reduce((sum, id) => sum + (personIn(draft, id).percent ?? 0), 0);
    return {
      total,
      totals,
      assigned: sumCents([...totals.values()]),
      included: included.length,
      check: included.length === 0 ? { kind: "nobody" } : { kind: "percent", assigned },
    };
  }

  const totals = new Map(included.map((id) => [id, personIn(draft, id).amount ?? ZERO_CENTS]));
  const assigned = draft.method === "AMOUNT" ? sumCents([...totals.values()]) : ZERO_CENTS;
  return {
    total,
    totals: draft.method === "AMOUNT" ? totals : new Map(),
    assigned,
    included: included.length,
    check:
      included.length === 0 || draft.method !== "AMOUNT"
        ? { kind: "nobody" }
        : { kind: "amount", difference: cents(total - assigned) },
  };
}
