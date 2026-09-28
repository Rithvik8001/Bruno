import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "./auth";
import { safeNextPath, signInPath } from "./redirect";

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(signInPath(returnTo));
  return session;
}

export async function redirectIfSignedIn(next?: string): Promise<void> {
  if (await getSession()) redirect(safeNextPath(next));
}
