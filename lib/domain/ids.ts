declare const idBrand: unique symbol;

type Id<Kind extends string> = string & { readonly [idBrand]: Kind };

export type PersonId = Id<"Person">;
export type GroupId = Id<"Group">;
export type BillId = Id<"Bill">;
export type LineItemId = Id<"LineItem">;
export type SettlementId = Id<"Settlement">;

function brand<T extends string>(value: string): T {
  if (value.length === 0) throw new RangeError("Ids must not be empty");
  return value as T;
}

export const personId = (value: string): PersonId => brand<PersonId>(value);
export const groupId = (value: string): GroupId => brand<GroupId>(value);
export const billId = (value: string): BillId => brand<BillId>(value);
export const lineItemId = (value: string): LineItemId => brand<LineItemId>(value);
export const settlementId = (value: string): SettlementId => brand<SettlementId>(value);

export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
