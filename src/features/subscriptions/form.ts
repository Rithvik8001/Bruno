import {
  compareDates,
  fromLocalDate,
  isInTrial,
  nextRenewal,
  toLocalDate,
  type BillingCycle,
  type CalendarDate,
} from "@/lib/calendar";
import { parseAmount, toAmountInput } from "@/lib/money";

import {
  cyclePresetFor,
  defaultCyclePreset,
  isCategory,
  isCyclePreset,
  presetCycle,
  type Category,
  type CyclePreset,
  type NewSubscription,
  type Subscription,
} from "./types";
import {
  isValidName,
  isValidNotes,
  isValidPaymentMethod,
  isValidRenewalDate,
  isValidServiceKey,
  normalizeName,
  normalizeOptional,
} from "./validation";

export const noCategory = "none";

export type CategoryChoice = Category | typeof noCategory;

export const customCycle = "custom";

export type CycleChoice = CyclePreset | typeof customCycle;

export type SubscriptionDraft = {
  name: string;
  amount: string;
  cycle: CycleChoice;
  date: Date;
  category: CategoryChoice;
  trial: boolean;
  paymentMethod: string;
  notes: string;
  serviceKey: string | null;
};

export function emptyDraft(start: CalendarDate): SubscriptionDraft {
  return {
    name: "",
    amount: "",
    cycle: defaultCyclePreset,
    date: toLocalDate(start),
    category: noCategory,
    trial: false,
    paymentMethod: "",
    notes: "",
    serviceKey: null,
  };
}

export function draftFrom(
  subscription: Subscription,
  from: CalendarDate,
): SubscriptionDraft {
  return {
    name: subscription.name,
    amount: toAmountInput(subscription.amountMinor, subscription.currency),
    cycle: cyclePresetFor(subscription.cycle) ?? customCycle,
    date: toLocalDate(
      nextRenewal(subscription.anchorDate, subscription.cycle, from),
    ),
    category: subscription.category ?? noCategory,
    trial: isInTrial(subscription.trialEndsOn, from),
    paymentMethod: subscription.paymentMethod ?? "",
    notes: subscription.notes ?? "",
    serviceKey: subscription.serviceKey,
  };
}

export function hasExtras(draft: SubscriptionDraft): boolean {
  return (
    draft.trial || draft.paymentMethod.length > 0 || draft.notes.length > 0
  );
}

function resolveCycle(
  choice: CycleChoice,
  baseCycle: BillingCycle | null,
): BillingCycle | null {
  return isCyclePreset(choice) ? presetCycle(choice) : baseCycle;
}

export function draftInput(
  draft: SubscriptionDraft,
  currency: string | null,
  start: CalendarDate,
  baseCycle: BillingCycle | null,
): NewSubscription | null {
  if (currency === null) {
    return null;
  }
  const amountMinor = parseAmount(draft.amount, currency);
  const cycle = resolveCycle(draft.cycle, baseCycle);
  const anchorDate = fromLocalDate(draft.date);

  if (
    amountMinor === null ||
    cycle === null ||
    !isValidName(draft.name) ||
    !isValidRenewalDate(anchorDate, start) ||
    !isValidPaymentMethod(draft.paymentMethod) ||
    !isValidNotes(draft.notes) ||
    (draft.serviceKey !== null && !isValidServiceKey(draft.serviceKey))
  ) {
    return null;
  }

  return {
    name: draft.name,
    amountMinor,
    cycle,
    anchorDate,
    trial: draft.trial,
    category: isCategory(draft.category) ? draft.category : null,
    paymentMethod: draft.paymentMethod,
    notes: draft.notes,
    serviceKey: draft.serviceKey,
  };
}

export function isDraftDirty(
  input: NewSubscription,
  subscription: Subscription,
  from: CalendarDate,
): boolean {
  return (
    normalizeName(input.name) !== subscription.name ||
    input.amountMinor !== subscription.amountMinor ||
    input.cycle.unit !== subscription.cycle.unit ||
    input.cycle.count !== subscription.cycle.count ||
    compareDates(
      input.anchorDate,
      nextRenewal(subscription.anchorDate, subscription.cycle, from),
    ) !== 0 ||
    input.trial !== isInTrial(subscription.trialEndsOn, from) ||
    input.category !== subscription.category ||
    normalizeOptional(input.paymentMethod) !== subscription.paymentMethod ||
    normalizeOptional(input.notes) !== subscription.notes ||
    input.serviceKey !== subscription.serviceKey
  );
}
