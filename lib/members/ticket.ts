import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

const PURPOSE = "add-member:v1";
const TTL_MS = 10 * 60 * 1000;

export interface TicketClaims {
  readonly actor: string;
  readonly group: string;
  readonly target: string;
}

interface TicketPayload extends TicketClaims {
  readonly exp: number;
}

function sign(body: string): Buffer {
  return createHmac("sha256", serverEnv().BETTER_AUTH_SECRET).update(`${PURPOSE}|${body}`).digest();
}

export function signTicket(claims: TicketClaims, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...claims, exp: now + TTL_MS } satisfies TicketPayload)).toString("base64url");
  return `${body}.${sign(body).toString("base64url")}`;
}

function isPayload(value: unknown): value is TicketPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.actor === "string" && typeof v.group === "string" && typeof v.target === "string" && typeof v.exp === "number";
}

export function verifyTicket(ticket: string, expected: Omit<TicketClaims, "target">, now = Date.now()): string | null {
  const [body, mac] = ticket.split(".");
  if (!body || !mac) return null;
  const given = Buffer.from(mac, "base64url");
  const wanted = sign(body);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isPayload(payload)) return null;
  if (payload.exp < now || payload.actor !== expected.actor || payload.group !== expected.group) return null;
  return payload.target;
}
