import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

interface Expiring {
  readonly exp: number;
}

function sign(purpose: string, body: string): Buffer {
  return createHmac("sha256", serverEnv().BETTER_AUTH_SECRET).update(`${purpose}|${body}`).digest();
}

export function signToken<T extends object>(purpose: string, claims: T, ttlMs: number, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...claims, exp: now + ttlMs })).toString("base64url");
  return `${body}.${sign(purpose, body).toString("base64url")}`;
}

export function verifyToken<T extends object>(
  purpose: string,
  token: string,
  guard: (value: Record<string, unknown>) => value is Record<string, unknown> & T,
  now = Date.now(),
): T | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const given = Buffer.from(mac, "base64url");
  const wanted = sign(purpose, body);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown> & Partial<Expiring>;
  if (typeof record.exp !== "number" || record.exp < now) return null;
  return guard(record) ? record : null;
}
