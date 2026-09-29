import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { isSignedInRoute, signInPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;
  if (hasSession && pathname === routes.home) {
    return NextResponse.redirect(new URL(routes.app, request.url));
  }
  if (!hasSession && isSignedInRoute(pathname)) {
    return NextResponse.redirect(
      new URL(signInPath(`${pathname}${search}`), request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home/:path*", "/groups/:path*", "/activity/:path*", "/bills/:path*", "/settings/:path*", "/welcome/:path*", "/j/:path*"],
};
