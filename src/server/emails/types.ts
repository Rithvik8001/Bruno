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
