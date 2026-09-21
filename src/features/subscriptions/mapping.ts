import { isCycleUnit, parseDbDate, toDbDate } from "@/lib/calendar";
import { isCurrencyCode } from "@/lib/money";
import type { Database } from "@/lib/supabase/database.types";

import {
  isCategory,
  isSubscriptionStatus,
  type NewSubscription,
  type Subscription,
} from "./types";
import { normalizeName, normalizeOptional } from "./validation";

export type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

export type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];

export const subscriptionColumns =
  "id, name, amount_minor, currency, cycle_unit, cycle_count, anchor_date, trial_ends_on, status, category, payment_method, notes, created_at";

export type SubscriptionSelection = Pick<
  SubscriptionRow,
  | "id"
  | "name"
  | "amount_minor"
  | "currency"
  | "cycle_unit"
  | "cycle_count"
  | "anchor_date"
  | "trial_ends_on"
  | "status"
  | "category"
  | "payment_method"
  | "notes"
  | "created_at"
>;

export function fromRow(row: SubscriptionSelection): Subscription | null {
  const anchorDate = parseDbDate(row.anchor_date);
  const trialEndsOn =
    row.trial_ends_on === null ? null : parseDbDate(row.trial_ends_on);

  if (
    anchorDate === null ||
    (row.trial_ends_on !== null && trialEndsOn === null) ||
    !isCycleUnit(row.cycle_unit) ||
    !isSubscriptionStatus(row.status) ||
    !isCurrencyCode(row.currency) ||
    !Number.isSafeInteger(row.amount_minor) ||
    !Number.isInteger(row.cycle_count) ||
    row.cycle_count < 1
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    amountMinor: row.amount_minor,
    currency: row.currency,
    cycle: { unit: row.cycle_unit, count: row.cycle_count },
    anchorDate,
    trialEndsOn,
    status: row.status,
    category: isCategory(row.category) ? row.category : null,
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function fromRows(rows: readonly SubscriptionSelection[]): Subscription[] {
  return rows
    .map(fromRow)
    .filter((subscription) => subscription !== null);
}

export function toInsert(
  input: NewSubscription,
  currency: string,
): SubscriptionInsert {
  const anchor = toDbDate(input.anchorDate);

  return {
    name: normalizeName(input.name),
    amount_minor: input.amountMinor,
    currency,
    cycle_unit: input.cycle.unit,
    cycle_count: input.cycle.count,
    anchor_date: anchor,
    trial_ends_on: input.trial ? anchor : null,
    category: input.category,
    payment_method: normalizeOptional(input.paymentMethod),
    notes: normalizeOptional(input.notes),
  };
}
