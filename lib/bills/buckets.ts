import type { PaletteTint } from "@/lib/design-system/tokens";
import type { ItemCategory } from "./types";

export const SPEND_BUCKETS = ["FOOD", "DRINKS", "GROCERIES", "TRAVEL", "HOUSEHOLD", "OTHER"] as const;
export type SpendBucket = (typeof SPEND_BUCKETS)[number];

const bucketByCategory = {
  STARTER: "FOOD",
  MAIN: "FOOD",
  SIDE: "FOOD",
  DESSERT: "FOOD",
  DRINK: "DRINKS",
  GROCERY: "GROCERIES",
  TRANSPORT: "TRAVEL",
  HOUSEHOLD: "HOUSEHOLD",
  OTHER: "OTHER",
} as const satisfies Record<ItemCategory, SpendBucket>;

export const bucketTint = {
  FOOD: "orange",
  DRINKS: "pink",
  GROCERIES: "green",
  TRAVEL: "blue",
  HOUSEHOLD: "indigo",
  OTHER: "violet",
} as const satisfies Record<SpendBucket, PaletteTint>;

export const bucketLabel = {
  FOOD: "Food",
  DRINKS: "Drinks",
  GROCERIES: "Groceries",
  TRAVEL: "Travel",
  HOUSEHOLD: "Household",
  OTHER: "Other",
} as const satisfies Record<SpendBucket, string>;

export function bucketOf(category: ItemCategory | null): SpendBucket {
  return category === null ? "OTHER" : bucketByCategory[category];
}

export function isSpendBucket(value: string): value is SpendBucket {
  return (SPEND_BUCKETS as readonly string[]).includes(value);
}
