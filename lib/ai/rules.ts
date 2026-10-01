export const AI_FREE_MISSES = 6;
export const AI_RETRY_GAP_MS = 15_000;
export const AI_RETRY_GAP_MAX_MS = 5 * 60 * 1000;
export const AI_GAP_LOOKBACK = 6;
export const AI_BREAKER_WINDOW_MS = 60_000;
export const AI_BREAKER_FAILS = 5;
export const AI_UPSTREAM_FAILURES = ["timeout", "failed"] as const;

export function retryGapMs(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 0;
  return Math.min(AI_RETRY_GAP_MAX_MS, AI_RETRY_GAP_MS * 2 ** (consecutiveFailures - 1));
}
