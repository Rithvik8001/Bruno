import type { IconName } from "@/components/icons/registry";
import type { PaletteTint, Tint } from "./tokens";

interface StatusAppearance {
  readonly label: string;
  readonly tint: PaletteTint;
  readonly icon: IconName;
}

export const billStatuses = {
  queued: { label: "Queued", tint: "violet", icon: "clock" },
  scheduled: { label: "Scheduled", tint: "blue", icon: "calendar" },
  claiming: { label: "Claiming", tint: "orange", icon: "timer" },
  ready: { label: "Ready", tint: "blue", icon: "check-circle" },
  overdue: { label: "Overdue", tint: "red", icon: "flame" },
  settled: { label: "Settled", tint: "green", icon: "check-circle" },
  waiting: { label: "Waiting", tint: "pink", icon: "clock" },
  paused: { label: "Paused", tint: "amber", icon: "pause-circle" },
  reviewing: { label: "Reviewing", tint: "cyan", icon: "document" },
} as const satisfies Record<string, StatusAppearance>;

export type BillStatus = keyof typeof billStatuses;

export const BALANCE_DIRECTIONS = ["owed", "owes", "settled"] as const;
export type BalanceDirection = (typeof BALANCE_DIRECTIONS)[number];

export const balanceTint = {
  owed: "green",
  owes: "red",
  settled: "muted",
} as const satisfies Record<BalanceDirection, Tint>;
