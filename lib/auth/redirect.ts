import { authParams, guestOnlyRoutes, routes, signedInRoutePrefixes } from "./rules";

const ORIGIN = "http://bruno.invalid";

export function isSignedInRoute(pathname: string): boolean {
  return signedInRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return guestOnlyRoutes.includes(pathname);
}

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return routes.app;
  }
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN || isGuestOnlyRoute(url.pathname)) return routes.app;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return routes.app;
  }
}

export function withNext(path: string, next: string): string {
  const target = safeNextPath(next);
  if (target === routes.app) return path;
  return `${path}?${new URLSearchParams({ [authParams.next]: target })}`;
}

export function signInPath(next?: string): string {
  return next === undefined ? routes.signIn : withNext(routes.signIn, next);
}

export function resetPasswordPath(email?: string): string {
  const trimmed = email?.trim();
  if (!trimmed) return routes.resetPassword;
  return `${routes.resetPassword}?${new URLSearchParams({ [authParams.email]: trimmed })}`;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
