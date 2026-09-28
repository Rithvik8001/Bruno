import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { isSignedInRoute, signInPath } from "@/lib/auth/redirect";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (getSessionCookie(request) === null && isSignedInRoute(pathname)) {
    return NextResponse.redirect(
      new URL(signInPath(`${pathname}${search}`), request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/groups/:path*", "/activity/:path*", "/bills/:path*", "/settings/:path*"],
};
