import type { BillingCycle, CalendarDate } from "@/lib/calendar";

export type RenewalEmail = {
  name: string;
  amountMinor: number;
  currency: string;
  renewsOn: CalendarDate;
  days: number;
  cycle: BillingCycle;
};

export type DigestRow = {
  name: string;
  dueOn: CalendarDate;
  amountMinor: number;
};

export type DigestEmail = {
  month: CalendarDate;
  currency: string;
  rows: DigestRow[];
  dueTotalMinor: number;
  monthlyMinor: number;
  topCategory: { label: string; monthlyMinor: number } | null;
};

export type ReminderKind = "renewal" | "trial" | "renews_today";

export type ReminderItem = {
  kind: ReminderKind;
  subscriptionId: string;
  dueOn: CalendarDate;
  input: RenewalEmail;
};

export type BatchSlot = "batch" | "batch_second";

export type BatchEmail = {
  items: ReminderItem[];
};
