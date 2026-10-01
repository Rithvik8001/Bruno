export const ASK_ACTION_KINDS = [
  "remindDebts",
  "remindClaims",
  "recordPayment",
  "settlePending",
  "splitEvenly",
  "changePayer",
  "renameBill",
  "changeDate",
  "changeTotal",
  "finishClaiming",
  "deleteBill",
] as const;
export type AskActionKind = (typeof ASK_ACTION_KINDS)[number];

export const ASK_BILL_ACTIONS = ["remindClaims", "splitEvenly", "changePayer", "renameBill", "changeDate", "changeTotal", "finishClaiming", "deleteBill"] as const satisfies readonly AskActionKind[];
export type AskBillAction = (typeof ASK_BILL_ACTIONS)[number];

export function isBillAction(kind: AskActionKind): kind is AskBillAction {
  return (ASK_BILL_ACTIONS as readonly string[]).includes(kind);
}

export const ASK_PROPOSE_KINDS = [...ASK_ACTION_KINDS, "addBill", "other"] as const;
export type AskProposeKind = (typeof ASK_PROPOSE_KINDS)[number];

export const ASK_PORTIONS = ["all", "half", "open"] as const;
export type AskPortion = (typeof ASK_PORTIONS)[number];

export const ASK_DECISIONS = ["confirm", "decline"] as const;
export type AskDecision = (typeof ASK_DECISIONS)[number];

export const ACTION_TTL_MS = 15 * 60 * 1000;
export const ACTION_STALE_MS = 45_000;
export const ACTION_SWEEP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
export const ACTION_BILLS_MAX = 6;
export const ACTION_DATE_BACK_DAYS = 730;
export const ACTION_MOVES_MAX = 4;
export const REMIND_PEOPLE_MAX = 25;
export const ACTION_WORKING_MIN_MS = 600;
