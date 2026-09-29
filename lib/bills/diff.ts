import type { BillValues } from "./schema";
import { participantRows, tipColumns } from "./write";

export const BILL_CHANGE_FIELDS = ["title", "date", "payer", "items", "amounts", "split"] as const;
export type BillChangeField = (typeof BILL_CHANGE_FIELDS)[number];

export function isBillChangeField(value: string): value is BillChangeField {
  return (BILL_CHANGE_FIELDS as readonly string[]).includes(value);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const sortedIds = (ids: readonly string[]) => [...ids].sort();

function itemsOf(values: BillValues) {
  return values.items.map((item) => ({ name: item.name, quantity: item.quantity, priceCents: item.priceCents }));
}

function splitOf(values: BillValues) {
  return {
    method: values.method,
    claims: values.method === "ITEMS" ? values.items.map((item) => sortedIds(item.claimedBy)) : [],
    participants: participantRows(values).sort((a, b) => a.personId.localeCompare(b.personId)),
  };
}

export function changedFields(before: BillValues, after: BillValues): BillChangeField[] {
  const changes: Record<BillChangeField, boolean> = {
    title: before.title !== after.title,
    date: before.occurredOn !== after.occurredOn,
    payer: before.payerId !== after.payerId,
    items: !same(itemsOf(before), itemsOf(after)),
    amounts:
      before.taxCents !== after.taxCents ||
      before.discountCents !== after.discountCents ||
      !same(tipColumns(before.tip), tipColumns(after.tip)),
    split: !same(splitOf(before), splitOf(after)),
  };
  return BILL_CHANGE_FIELDS.filter((field) => changes[field]);
}
