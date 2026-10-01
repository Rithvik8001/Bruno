import type { SplitMethod } from "@/lib/bills/types";

export const exportMessages = {
  badOrigin: "That request didn’t come from Bruno. Reload the page and try again.",
  groupGone: "That group isn’t here any more. Pick another group.",
  nothing: "Nothing to export for those choices.",
  tooBig: "That’s too much for one file. Pick a shorter date range.",
  limited: "You’ve exported a few times already. Try again in an hour.",
  limitedSoon: "You’ve exported a few times already. Try again in a minute.",
  dates: "Pick a start day that isn’t after the end day.",
  future: "Pick days up to today.",
  kinds: "Pick something to export.",
} as const;

export const exportSplitLabels = {
  ITEMS: "By item",
  EVEN: "Evenly",
  SHARES: "By shares",
  PERCENT: "By percent",
  AMOUNT: "Fixed amounts",
} as const satisfies Record<SplitMethod, string>;

export const exportStatusLabels = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
} as const;
