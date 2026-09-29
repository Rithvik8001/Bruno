import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const GUEST_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function newGuestToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
