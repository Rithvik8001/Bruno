import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ensurePersonForUser, findPersonForUser, type PersonView } from "@/lib/people/person";
import { auth, type Session } from "./auth";
import { safeNextPath, signInPath } from "./redirect";

export interface AppContext {
  readonly session: Session;
  readonly person: PersonView;
}

export const getSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

export const getAppContext = cache(async (): Promise<AppContext | null> => {
  const session = await getSession();
  if (!session) return null;
  const person = (await findPersonForUser(session.user.id)) ?? (await ensurePersonForUser(session.user));
  return { session, person };
});

export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(signInPath(returnTo));
  return session;
}

export async function requireAppContext(returnTo?: string): Promise<AppContext> {
  const context = await getAppContext();
  if (!context) redirect(signInPath(returnTo));
  return context;
}

export async function redirectIfSignedIn(next?: string): Promise<void> {
  if (await getSession()) redirect(safeNextPath(next));
}
