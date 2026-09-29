import "server-only";
import { signToken, verifyToken } from "@/lib/security/signed-token";

const PURPOSE = "add-member:v1";
const TTL_MS = 10 * 60 * 1000;

export interface TicketClaims {
  readonly actor: string;
  readonly group: string;
  readonly target: string;
}

function isClaims(value: Record<string, unknown>): value is Record<string, unknown> & TicketClaims {
  return typeof value.actor === "string" && typeof value.group === "string" && typeof value.target === "string";
}

export function signTicket(claims: TicketClaims, now = Date.now()): string {
  return signToken(PURPOSE, claims, TTL_MS, now);
}

export function verifyTicket(ticket: string, expected: Omit<TicketClaims, "target">, now = Date.now()): string | null {
  const claims = verifyToken(PURPOSE, ticket, isClaims, now);
  if (!claims || claims.actor !== expected.actor || claims.group !== expected.group) return null;
  return claims.target;
}
