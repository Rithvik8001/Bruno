import type { Plan } from "@/lib/generated/prisma/enums";

export const AI_LIMITS = { FREE: 10, PRO: 100 } as const satisfies Record<Plan, number>;
export const AI_FREE_MISSES = 10;
export const ALLOWANCE_LOW = 2;
export const AI_RETRY_GAP_MS = 15_000;
export const AI_RETRY_GAP_MAX_MS = 5 * 60 * 1000;
export const AI_GAP_LOOKBACK = 6;
export const AI_BREAKER_WINDOW_MS = 60_000;
export const AI_BREAKER_FAILS = 5;
export const AI_UPSTREAM_FAILURES = ["timeout", "failed"] as const;

export interface Allowance {
  readonly used: number;
  readonly limit: number;
  readonly left: number;
  readonly plan: Plan;
}

export function allowanceOf(used: number, limit: number, plan: Plan): Allowance {
  return { used, limit, left: Math.max(0, limit - used), plan };
}

export function allowanceSpent(allowance: Allowance): boolean {
  return allowance.left <= 0;
}

export function retryGapMs(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 0;
  return Math.min(
    AI_RETRY_GAP_MAX_MS,
    AI_RETRY_GAP_MS * 2 ** (consecutiveFailures - 1),
  );
}
