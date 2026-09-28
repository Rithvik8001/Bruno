import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/lib/auth/rules";

const guestOnly: readonly string[] = [routes.signUp, routes.signIn];
const signedInOnly: readonly string[] = [routes.app];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;

  if (hasSession && guestOnly.includes(pathname)) {
    return NextResponse.redirect(new URL(routes.app, request.url));
  }
  if (!hasSession && signedInOnly.includes(pathname)) {
    return NextResponse.redirect(new URL(routes.signUp, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-up", "/sign-in", "/home"],
};
