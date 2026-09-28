import type { Cents } from "@/lib/money";
import { computeShares } from "./split";
import type { BillInput, BillStatus } from "./types";

export const OVERDUE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export const BILL_DISPLAY_STATUSES = ["draft", "claiming", "ready", "overdue", "settled"] as const;
export type BillDisplayStatus = (typeof BILL_DISPLAY_STATUSES)[number];

export interface BillStatusInput {
  readonly status: BillStatus;
  readonly finalizedAt: Date | null;
  readonly outstanding: Cents;
}

export function canFinalize(input: BillInput): boolean {
  return computeShares(input).ok;
}

export function displayStatus({ status, finalizedAt, outstanding }: BillStatusInput, now: Date): BillDisplayStatus {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "CLAIMING":
      return "claiming";
    case "FINALIZED":
      if (outstanding <= 0) return "settled";
      if (finalizedAt && now.getTime() - finalizedAt.getTime() > OVERDUE_DAYS * DAY_MS) return "overdue";
      return "ready";
  }
}
