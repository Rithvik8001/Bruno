import type { BillingCycle, CalendarDate } from "@/lib/calendar";

export const categories = [
  "entertainment",
  "music",
  "productivity",
  "cloud_storage",
  "news_reading",
  "health_fitness",
  "gaming",
  "utilities_bills",
  "education",
  "other",
] as const;

export type Category = (typeof categories)[number];

export const subscriptionStatuses = ["active", "paused", "cancelled"] as const;

export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type DerivedStatus = SubscriptionStatus | "trial";

export const cyclePresets = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type CyclePreset = (typeof cyclePresets)[number];

export const defaultCyclePreset: CyclePreset = "monthly";

const presetCycles: Record<CyclePreset, BillingCycle> = {
  weekly: { unit: "week", count: 1 },
  monthly: { unit: "month", count: 1 },
  quarterly: { unit: "month", count: 3 },
  yearly: { unit: "year", count: 1 },
};

export function presetCycle(preset: CyclePreset): BillingCycle {
  return presetCycles[preset];
}

export function cyclePresetFor(cycle: BillingCycle): CyclePreset | null {
  return (
    cyclePresets.find((preset) => {
      const candidate = presetCycles[preset];
      return candidate.unit === cycle.unit && candidate.count === cycle.count;
    }) ?? null
  );
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSubscriptionId(
  value: string | string[] | undefined,
): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && uuidPattern.test(candidate)
    ? candidate
    : null;
}

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (categories as readonly string[]).includes(value)
  );
}

export function isSubscriptionStatus(
  value: unknown,
): value is SubscriptionStatus {
  return (
    typeof value === "string" &&
    (subscriptionStatuses as readonly string[]).includes(value)
  );
}

export function isCyclePreset(value: unknown): value is CyclePreset {
  return (
    typeof value === "string" &&
    (cyclePresets as readonly string[]).includes(value)
  );
}

export type Subscription = {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
  cycle: BillingCycle;
  anchorDate: CalendarDate;
  trialEndsOn: CalendarDate | null;
  status: SubscriptionStatus;
  category: Category | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
};

export type NewSubscription = {
  name: string;
  amountMinor: number;
  cycle: BillingCycle;
  anchorDate: CalendarDate;
  trial: boolean;
  category: Category | null;
  paymentMethod: string;
  notes: string;
};
