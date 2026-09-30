import type { ItemCategory } from "@/lib/bills/types";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const categoryTint = {
  STARTER: "green",
  MAIN: "orange",
  SIDE: "cyan",
  DRINK: "pink",
  DESSERT: "violet",
  GROCERY: "amber",
  TRANSPORT: "blue",
  HOUSEHOLD: "indigo",
  OTHER: "red",
} as const satisfies Record<ItemCategory, PaletteTint>;

export const categoryLabel = {
  STARTER: "Starter",
  MAIN: "Main",
  SIDE: "Side",
  DRINK: "Drinks",
  DESSERT: "Dessert",
  GROCERY: "Grocery",
  TRANSPORT: "Transport",
  HOUSEHOLD: "Household",
  OTHER: "Other",
} as const satisfies Record<ItemCategory, string>;
