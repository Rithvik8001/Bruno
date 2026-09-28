import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "./auth";
import { routes } from "./rules";

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(routes.signUp);
  return session;
}

export async function redirectIfSignedIn(): Promise<void> {
  if (await getSession()) redirect(routes.app);
}
