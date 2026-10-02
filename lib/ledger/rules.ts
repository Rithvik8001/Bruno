const HOUR_MS = 60 * 60 * 1000;

export const settlementRules = {
  undoWindowMs: 24 * HOUR_MS,
  autoConfirmAfterMs: 3 * 24 * HOUR_MS,
} as const;

export const SETTLEMENT_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];
