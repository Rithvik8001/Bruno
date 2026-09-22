type Rule = {
  limit: number;
  windowMs: number;
};

export const rateLimits = {
  signupPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  resendPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  codePerEmail: { limit: 1, windowMs: 60 * 1000 },
  resetPerIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  resetConfirmPerEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, Rule>;

const hits = new Map<string, number[]>();

export function consume(key: string, rule: Rule): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(
    (time) => now - time < rule.windowMs,
  );

  if (recent.length >= rule.limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first !== undefined && first.length > 0 ? first : "local";
}
