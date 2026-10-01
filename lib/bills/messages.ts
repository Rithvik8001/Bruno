import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { negateCents } from "@/lib/money";
import type { BillChangeField } from "./diff";
import { FULL_PERCENT_BPS, type SplitError } from "./types";

export const billMessages = {
  titleMissing: "Say where this was.",
  titleTooLong: (max: number) => `Keep it under ${max} characters.`,
  itemNameMissing: "Name this item.",
  itemNameTooLong: (max: number) => `Keep item names under ${max} characters.`,
  dateInvalid: "Pick a date.",
  noItems: "Add at least one item.",
  tooManyItems: (max: number) => `A bill can have up to ${max} items.`,
  duplicatePerson: "Someone is listed twice. Remove the extra one.",
  groupGone: "This group doesn’t exist any more. Pick another group.",
  notMember: "You’re not in this group any more. Ask a member for the invite link.",
  payerNotMember: "Whoever paid has to be in the group.",
  unknownPerson: "Everyone on the bill has to be in the group.",
  billGone: "This bill doesn’t exist any more. Go back to the group.",
  cantEdit: "Only whoever added the bill or a group admin can change it.",
} as const;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function splitErrorMessage(error: SplitError, currency: CurrencyCode): string {
  switch (error.kind) {
    case "noParticipants":
      return "Add at least one person to the split.";
    case "discountExceedsSubtotal":
      return `The discount is more than the ${formatMoney(error.subtotal, currency)} of items.`;
    case "invalidParticipantInput":
      return "Some of the shares aren’t valid. Check each person’s amount.";
    case "unclaimedItems": {
      const n = error.lineItemIds.length;
      return `${n} ${plural(n, "item has", "items have")} no one on ${plural(n, "it", "them")} yet. Assign ${plural(n, "it", "them")} to finish.`;
    }
    case "percentMismatch":
      return `Percentages add up to ${error.assignedBps / (FULL_PERCENT_BPS / 100)}%, not 100%.`;
    case "amountMismatch":
      return error.difference > 0
        ? `${formatMoney(error.difference, currency)} still unassigned.`
        : `${formatMoney(negateCents(error.difference), currency)} more than the bill.`;
  }
}

export const billFieldWords = {
  title: "name",
  date: "date",
  payer: "payer",
  items: "items",
  amounts: "tax and tip",
  split: "split",
} as const satisfies Record<BillChangeField, string>;

export interface ClaimedItem {
  readonly name: string;
  readonly ways: number;
}

const claimedName = (item: ClaimedItem) =>
  item.ways === 1 ? item.name : item.ways === 2 ? `half the ${item.name}` : `a share of the ${item.name}`;

export function claimedList(items: readonly ClaimedItem[]): string {
  const names = items.map(claimedName);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
