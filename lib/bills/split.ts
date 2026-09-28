import { compareIds, type LineItemId, type PersonId } from "@/lib/domain/ids";
import { err, ok, type Result } from "@/lib/domain/result";
import { allocate, cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { billTotals } from "./totals";
import {
  FULL_PERCENT_BPS,
  type BillInput,
  type BillParticipantInput,
  type BillSplit,
  type BillTotals,
  type LineShare,
  type PersonShare,
  type SplitError,
} from "./types";

export type SplitProgress =
  | { readonly kind: "items"; readonly unclaimedCount: number; readonly unclaimedTotal: Cents }
  | { readonly kind: "percent"; readonly assignedBps: number; readonly remainingBps: number }
  | { readonly kind: "amount"; readonly assigned: Cents; readonly remaining: Cents }
  | { readonly kind: "weighted"; readonly participants: number };

const sortedUnique = (ids: readonly PersonId[]): PersonId[] => [...new Set(ids)].sort(compareIds);

const byPerson = (participants: readonly BillParticipantInput[]): BillParticipantInput[] =>
  [...participants].sort((a, b) => compareIds(a.personId, b.personId));

function weightsOrEven(weights: readonly number[]): number[] {
  return weights.some((w) => w > 0) ? [...weights] : weights.map(() => 1);
}

function buildShares(
  people: readonly PersonId[],
  itemAmounts: readonly Cents[],
  totals: BillTotals,
  weights: readonly number[],
  lines: ReadonlyMap<PersonId, LineShare[]>,
): Map<PersonId, PersonShare> {
  const w = weightsOrEven(weights);
  const discounts = allocate(totals.discount, w);
  const taxes = allocate(totals.tax, w);
  const tips = allocate(totals.tip, w);
  return new Map(
    people.map((personId, i) => {
      const items = itemAmounts[i] ?? ZERO_CENTS;
      const discount = discounts[i] ?? ZERO_CENTS;
      const tax = taxes[i] ?? ZERO_CENTS;
      const tip = tips[i] ?? ZERO_CENTS;
      const share: PersonShare = {
        items,
        discount,
        tax,
        tip,
        total: cents(items - discount + tax + tip),
        lines: lines.get(personId) ?? [],
      };
      return [personId, share];
    }),
  );
}

function splitByItems(input: BillInput, totals: BillTotals): Result<BillSplit, SplitError> {
  const unclaimed: LineItemId[] = input.items
    .filter((item) => item.priceCents > 0 && item.claimedBy.length === 0)
    .map((item) => item.id);
  if (unclaimed.length > 0) return err({ kind: "unclaimedItems", lineItemIds: unclaimed });

  const people = sortedUnique(input.items.flatMap((item) => item.claimedBy));
  if (people.length === 0) return err({ kind: "noParticipants" });

  const lines = new Map<PersonId, LineShare[]>(people.map((p) => [p, []]));
  for (const item of input.items) {
    const claimants = sortedUnique(item.claimedBy);
    if (claimants.length === 0) continue;
    allocate(
      item.priceCents,
      claimants.map(() => 1),
    ).forEach((amount, i) => {
      const person = claimants[i];
      if (person) lines.get(person)?.push({ lineItemId: item.id, amount });
    });
  }

  const itemAmounts = people.map((p) => sumCents((lines.get(p) ?? []).map((l) => l.amount)));
  return ok({ totals, shares: buildShares(people, itemAmounts, totals, itemAmounts, lines) });
}

const invalidInput = (participants: readonly BillParticipantInput[]): Result<never, SplitError> =>
  err({ kind: "invalidParticipantInput", personIds: participants.map((p) => p.personId) });

function participantWeights(input: BillInput, total: Cents): Result<number[], SplitError> {
  const participants = byPerson(input.participants);
  switch (input.method) {
    case "EVEN":
      return ok(participants.map(() => 1));
    case "SHARES": {
      const invalid = participants.filter((p) => !Number.isSafeInteger(p.shares) || p.shares < 1);
      if (invalid.length > 0) return invalidInput(invalid);
      return ok(participants.map((p) => p.shares));
    }
    case "PERCENT": {
      const invalid = participants.filter(
        (p) => p.percentBps !== null && (!Number.isSafeInteger(p.percentBps) || p.percentBps < 0),
      );
      if (invalid.length > 0) return invalidInput(invalid);
      const bps = participants.map((p) => p.percentBps ?? 0);
      const assignedBps = bps.reduce((a, b) => a + b, 0);
      if (assignedBps !== FULL_PERCENT_BPS) return err({ kind: "percentMismatch", assignedBps });
      return ok(bps);
    }
    case "AMOUNT": {
      const invalid = participants.filter((p) => p.amountCents !== null && p.amountCents < 0);
      if (invalid.length > 0) return invalidInput(invalid);
      const amounts = participants.map((p) => p.amountCents ?? ZERO_CENTS);
      const assigned = sumCents(amounts);
      if (assigned !== total) return err({ kind: "amountMismatch", assigned, difference: cents(total - assigned) });
      return ok(amounts);
    }
    case "ITEMS":
      return ok([]);
  }
}

function splitByParticipants(input: BillInput, totals: BillTotals): Result<BillSplit, SplitError> {
  const participants = byPerson(input.participants);
  if (participants.length === 0) return err({ kind: "noParticipants" });

  const weights = participantWeights(input, totals.total);
  if (!weights.ok) return weights;

  const people = participants.map((p) => p.personId);
  const personTotals =
    input.method === "AMOUNT"
      ? participants.map((p) => p.amountCents ?? ZERO_CENTS)
      : allocate(totals.total, weights.value);
  const w = weightsOrEven(personTotals);
  const discounts = allocate(totals.discount, w);
  const taxes = allocate(totals.tax, w);
  const tips = allocate(totals.tip, w);

  const shares = new Map<PersonId, PersonShare>(
    people.map((personId, i) => {
      const total = personTotals[i] ?? ZERO_CENTS;
      const discount = discounts[i] ?? ZERO_CENTS;
      const tax = taxes[i] ?? ZERO_CENTS;
      const tip = tips[i] ?? ZERO_CENTS;
      return [personId, { items: cents(total + discount - tax - tip), discount, tax, tip, total, lines: [] }];
    }),
  );
  return ok({ totals, shares });
}

export function computeShares(input: BillInput): Result<BillSplit, SplitError> {
  const totals = billTotals(
    input.items.map((item) => item.priceCents),
    input,
  );
  if (!totals.ok) return totals;
  return input.method === "ITEMS" ? splitByItems(input, totals.value) : splitByParticipants(input, totals.value);
}

export function splitProgress(input: BillInput): SplitProgress {
  switch (input.method) {
    case "ITEMS": {
      const unclaimed = input.items.filter((item) => item.priceCents > 0 && item.claimedBy.length === 0);
      return {
        kind: "items",
        unclaimedCount: unclaimed.length,
        unclaimedTotal: sumCents(unclaimed.map((item) => item.priceCents)),
      };
    }
    case "PERCENT": {
      const assignedBps = input.participants.reduce((a, p) => a + (p.percentBps ?? 0), 0);
      return { kind: "percent", assignedBps, remainingBps: FULL_PERCENT_BPS - assignedBps };
    }
    case "AMOUNT": {
      const totals = billTotals(
        input.items.map((item) => item.priceCents),
        input,
      );
      const total = totals.ok ? totals.value.total : ZERO_CENTS;
      const assigned = sumCents(input.participants.map((p) => p.amountCents ?? ZERO_CENTS));
      return { kind: "amount", assigned, remaining: cents(total - assigned) };
    }
    case "EVEN":
    case "SHARES":
      return { kind: "weighted", participants: input.participants.length };
  }
}
