export const ASK_TEXT_MAX = 200;
export const ASK_COUNT_FROM = 150;
export const ASK_MIN_LETTERS = 3;
export const ASK_MODEL = "gpt-5.6-luna";
export const ASK_REASONING = "low";
export const ASK_STEPS_MAX = 5;
export const ASK_TIMEOUT_MS = 25_000;
export const ASK_STEP_TIMEOUT_MS = 12_000;
export const ASK_MAX_OUTPUT_TOKENS = 500;
export const ASK_STALE_MS = 45_000;
export const ASK_CONTEXT_TURNS = 3;
export const ASK_GROUPS_MAX = 25;
export const ASK_PEOPLE_MAX = 60;
export const ASK_NAME_MAX = 40;
export const ASK_SHOWN_MAX = 240;
export const ASK_ROWS_MAX = 12;
export const ASK_BILLS_MAX = 30;
export const ASK_TOP_BILLS = 3;
export const ASK_HISTORY_MAX = 24;
export const ASK_EVENTS_MAX = 12;
export const ASK_FIND_MAX = 6;
export const ASK_CLARIFY_MAX = 2;
export const ASK_CLARIFY_OPTIONS_MAX = 4;
export const ASK_MONTHS = 4;
export const ASK_DECLINE_STREAK = 3;
export const ASK_DECLINE_GAP_MS = 30_000;
export const ASK_DECLINE_GAP_MAX_MS = 5 * 60 * 1000;
export const ASK_DECLINE_LOOKBACK = 8;
export const ASK_SWEEP_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
export const ASK_SWEEP_CHANCE = 0.02;

export const ASK_DECLINE_REASONS = ["outOfScope", "notYourGroup", "wantsChange"] as const;
export type AskDeclineReason = (typeof ASK_DECLINE_REASONS)[number];

export const ASK_FAILURES = ["timeout", "failed"] as const;
export type AskFailure = (typeof ASK_FAILURES)[number];

export function declineGapMs(streak: number): number {
  if (streak < ASK_DECLINE_STREAK) return 0;
  return Math.min(ASK_DECLINE_GAP_MAX_MS, ASK_DECLINE_GAP_MS * 2 ** (streak - ASK_DECLINE_STREAK));
}
