import "server-only";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";
import { signToken, verifyToken } from "@/lib/security/signed-token";

const COOKIE = "bruno_guest";
const PURPOSE = "claim-guest:v1";
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

export interface GuestSession {
  readonly personId: string;
  readonly groupId: string;
}

function isSession(value: Record<string, unknown>): value is Record<string, unknown> & GuestSession {
  return typeof value.personId === "string" && typeof value.groupId === "string";
}

export async function readGuestSession(): Promise<GuestSession | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const session = verifyToken(PURPOSE, raw, isSession);
  return session ? { personId: session.personId, groupId: session.groupId } : null;
}

export async function setGuestSession(session: GuestSession): Promise<void> {
  (await cookies()).set(COOKIE, signToken(PURPOSE, session, TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function clearGuestSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
