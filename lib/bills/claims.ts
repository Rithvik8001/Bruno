import type { LineItemId, PersonId } from "@/lib/domain/ids";
import { allocate, cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { computeShares } from "./split";
import { billTotals } from "./totals";
import type { BillCharges, BillInput, BillLine } from "./types";

export interface ClaimSummaryLine {
  readonly id: LineItemId;
  readonly price: Cents;
  readonly claimants: readonly PersonId[];
  readonly each: Cents | null;
}

export interface ClaimShare {
  readonly total: Cents;
  readonly extras: Cents;
}

export interface ClaimSummary {
  readonly lines: readonly ClaimSummaryLine[];
  readonly claimed: number;
  readonly unclaimedIds: readonly LineItemId[];
  readonly unclaimedTotal: Cents;
  readonly extras: Cents;
  readonly ready: boolean;
  readonly shareOf: (person: PersonId) => ClaimShare;
}

const NO_SHARE: ClaimShare = { total: ZERO_CENTS, extras: ZERO_CENTS };

function itemsShareOf(lines: readonly BillLine[], person: PersonId): Cents {
  return sumCents(
    lines.map((line) => {
      const index = line.claimedBy.indexOf(person);
      if (index < 0) return ZERO_CENTS;
      return allocate(line.priceCents, line.claimedBy.map(() => 1))[index] ?? ZERO_CENTS;
    }),
  );
}

export function claimSummary(lines: readonly BillLine[], charges: BillCharges): ClaimSummary {
  const input: BillInput = { ...charges, method: "ITEMS", items: lines, participants: [] };
  const totals = billTotals(
    lines.map((line) => line.priceCents),
    charges,
  );
  const extras = totals.ok ? cents(totals.value.tax + totals.value.tip - totals.value.discount) : ZERO_CENTS;
  const subtotal = totals.ok ? totals.value.subtotal : ZERO_CENTS;
  const split = computeShares(input);
  const unclaimed = lines.filter((line) => line.claimedBy.length === 0 && line.priceCents > 0);

  const shareOf = (person: PersonId): ClaimShare => {
    if (split.ok) {
      const share = split.value.shares.get(person);
      return share ? { total: share.total, extras: cents(share.tax + share.tip - share.discount) } : NO_SHARE;
    }
    const items = itemsShareOf(lines, person);
    const mine = subtotal > 0 ? cents(Math.round((extras * items) / subtotal)) : ZERO_CENTS;
    return { total: cents(items + mine), extras: mine };
  };

  return {
    lines: lines.map((line) => ({
      id: line.id,
      price: line.priceCents,
      claimants: line.claimedBy,
      each: line.claimedBy.length > 1 ? cents(Math.round(line.priceCents / line.claimedBy.length)) : null,
    })),
    claimed: lines.filter((line) => line.claimedBy.length > 0).length,
    unclaimedIds: unclaimed.map((line) => line.id),
    unclaimedTotal: sumCents(unclaimed.map((line) => line.priceCents)),
    extras,
    ready: split.ok,
    shareOf,
  };
}

export function restClaimants(lines: readonly BillLine[], payer: PersonId): PersonId[] {
  return [...new Set([...lines.flatMap((line) => line.claimedBy), payer])];
}
