import {
  compareDates,
  isInTrial,
  nextRenewal,
  type CalendarDate,
} from "@/lib/calendar";

import type { DerivedStatus, Subscription } from "./types";

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

function isBilling(status: DerivedStatus): boolean {
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
