import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export const GUEST_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function newGuestToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface GuestTokenGrant {
  readonly personId: string;
  readonly groupId: string;
  readonly createdById: string;
}

export async function issueGuestToken({ personId, groupId, createdById }: GuestTokenGrant): Promise<string> {
  const token = newGuestToken();
  await db.$transaction([
    db.guestToken.deleteMany({ where: { personId, usedAt: null } }),
    db.guestToken.create({
      data: {
        tokenHash: hashGuestToken(token),
        personId,
        groupId,
        createdById,
        expiresAt: new Date(Date.now() + GUEST_TOKEN_TTL_MS),
      },
    }),
  ]);
  return token;
}
