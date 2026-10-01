import "server-only";
import { signToken, verifyToken } from "@/lib/security/signed-token";
import { isNotificationCategory, type NotificationCategory } from "./kinds";

const DAY_MS = 24 * 60 * 60 * 1000;
const UNSUBSCRIBE_PURPOSE = "unsubscribe:v1";
const UNSUBSCRIBE_TTL_MS = 365 * DAY_MS;
const LOCK_PURPOSE = "lock-account:v1";
const LOCK_TTL_MS = DAY_MS;

export interface UnsubscribeClaims {
  readonly personId: string;
  readonly category: NotificationCategory;
}

export interface LockClaims {
  readonly userId: string;
}

export function unsubscribeToken(claims: UnsubscribeClaims): string {
  return signToken(UNSUBSCRIBE_PURPOSE, claims, UNSUBSCRIBE_TTL_MS);
}

export function readUnsubscribeToken(token: string): UnsubscribeClaims | null {
  return verifyToken<UnsubscribeClaims>(
    UNSUBSCRIBE_PURPOSE,
    token,
    (value): value is Record<string, unknown> & UnsubscribeClaims =>
      typeof value.personId === "string" && isNotificationCategory(value.category),
  );
}

export function lockToken(claims: LockClaims): string {
  return signToken(LOCK_PURPOSE, claims, LOCK_TTL_MS);
}

export function readLockToken(token: string): LockClaims | null {
  return verifyToken<LockClaims>(
    LOCK_PURPOSE,
    token,
    (value): value is Record<string, unknown> & LockClaims => typeof value.userId === "string",
  );
}
