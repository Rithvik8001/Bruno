import {
  compareDates,
  daysBetween,
  isInTrial,
  nextRenewal,
  type CalendarDate,
} from "@/lib/calendar";
import { monthlyAmountExact, monthlyAmountMinor } from "@/lib/money";

import type {
  Category,
  DerivedStatus,
  Subscription,
  SubscriptionStatus,
} from "./types";

export type UpcomingSubscription = {
  subscription: Subscription;
  nextRenewal: CalendarDate;
  status: DerivedStatus;
};

export function derivedStatus(
  subscription: Subscription,
  today: CalendarDate,
): DerivedStatus {
  if (
    subscription.status === "active" &&
    isInTrial(subscription.trialEndsOn, today)
  ) {
    return "trial";
  }
  return subscription.status;
}

export function isBilling(status: DerivedStatus): boolean {
  return status === "active" || status === "trial";
}

export function sortByNextRenewal(
  subscriptions: readonly Subscription[],
  today: CalendarDate,
): UpcomingSubscription[] {
  return subscriptions
    .map((subscription) => ({
      subscription,
      nextRenewal: nextRenewal(
        subscription.anchorDate,
        subscription.cycle,
        today,
      ),
      status: derivedStatus(subscription, today),
    }))
    .sort((a, b) => {
      const billingA = isBilling(a.status);
      const billingB = isBilling(b.status);
      if (billingA !== billingB) {
        return billingA ? -1 : 1;
      }
      const byDate = compareDates(a.nextRenewal, b.nextRenewal);
      if (byDate !== 0) {
        return byDate;
      }
      return a.subscription.name.localeCompare(b.subscription.name);
    });
}

const monthsPerYear = 12;

export type OverviewSummary = {
  monthlyMinor: number;
  yearlyMinor: number;
  count: number;
  billing: UpcomingSubscription[];
};

export function summarize(
  subscriptions: readonly Subscription[],
  today: CalendarDate,
  currency: string,
): OverviewSummary {
  const billing = sortByNextRenewal(subscriptions, today).filter(
    (item) =>
      isBilling(item.status) && item.subscription.currency === currency,
  );
  const exact = billing.reduce(
    (sum, item) =>
      sum +
      monthlyAmountExact(item.subscription.amountMinor, item.subscription.cycle),
    0,
  );

  return {
    monthlyMinor: Math.round(exact),
    yearlyMinor: Math.round(exact * monthsPerYear),
    count: billing.length,
    billing,
  };
}

export type DueWindow = {
  items: UpcomingSubscription[];
  totalMinor: number;
};

export function dueWithin(
  billing: readonly UpcomingSubscription[],
  today: CalendarDate,
  days: number,
): DueWindow {
  const items = billing.filter(
    (item) => daysBetween(today, item.nextRenewal) <= days,
  );
  return {
    items,
    totalMinor: items.reduce(
      (sum, item) => sum + item.subscription.amountMinor,
      0,
    ),
  };
}

export type CategoryShare = {
  category: Category;
  monthlyMinor: number;
  share: number;
};

export function categoryBreakdown(
  billing: readonly UpcomingSubscription[],
  limit: number,
): CategoryShare[] {
  const totals = new Map<Category, number>();
  for (const item of billing) {
    const category = item.subscription.category ?? "other";
    const exact = monthlyAmountExact(
      item.subscription.amountMinor,
      item.subscription.cycle,
    );
    totals.set(category, (totals.get(category) ?? 0) + exact);
  }
  const overall = [...totals.values()].reduce((sum, value) => sum + value, 0);
  if (overall <= 0) {
    return [];
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, exact]) => ({
      category,
      monthlyMinor: Math.round(exact),
      share: exact / overall,
    }));
}

export type StatusCounts = Record<SubscriptionStatus, number> & {
  total: number;
};

export function statusCounts(
  subscriptions: readonly Subscription[],
): StatusCounts {
  const counts: StatusCounts = {
    total: subscriptions.length,
    active: 0,
    paused: 0,
    cancelled: 0,
  };
  for (const subscription of subscriptions) {
    counts[subscription.status] += 1;
  }
  return counts;
}

export function displayAmountMinor(subscription: Subscription): number {
  return subscription.cycle.unit === "year"
    ? monthlyAmountMinor(subscription.amountMinor, subscription.cycle)
    : subscription.amountMinor;
}

export const listFilters = ["all", "monthly", "yearly", "paused"] as const;

export type ListFilter = (typeof listFilters)[number];

export function applyListFilter(
  items: readonly UpcomingSubscription[],
  filter: ListFilter,
): UpcomingSubscription[] {
  switch (filter) {
    case "all":
      return [...items];
    case "monthly":
      return items.filter((item) => item.subscription.cycle.unit === "month");
    case "yearly":
      return items.filter((item) => item.subscription.cycle.unit === "year");
    case "paused":
      return items.filter((item) => !isBilling(item.status));
  }
}

export type LedgerGroup =
  | {
      kind: "month";
      key: string;
      month: CalendarDate;
      items: UpcomingSubscription[];
      totalMinor: number;
    }
  | {
      kind: "status";
      key: string;
      status: SubscriptionStatus;
      items: UpcomingSubscription[];
    };

export function groupLedger(
  items: readonly UpcomingSubscription[],
): LedgerGroup[] {
  const months = new Map<string, LedgerGroup & { kind: "month" }>();
  const statuses = new Map<
    SubscriptionStatus,
    LedgerGroup & { kind: "status" }
  >();

  for (const item of items) {
    if (isBilling(item.status)) {
      const key = `${item.nextRenewal.year}-${item.nextRenewal.month}`;
      const group = months.get(key) ?? {
        kind: "month",
        key,
        month: { year: item.nextRenewal.year, month: item.nextRenewal.month, day: 1 },
        items: [],
        totalMinor: 0,
      };
      group.items.push(item);
      group.totalMinor += displayAmountMinor(item.subscription);
      months.set(key, group);
      continue;
    }
    const status = item.subscription.status;
    const group = statuses.get(status) ?? {
      kind: "status",
      key: status,
      status,
      items: [],
    };
    group.items.push(item);
    statuses.set(status, group);
  }

  return [...months.values(), ...statuses.values()];
}
