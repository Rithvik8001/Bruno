import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/lib/auth/rules";
import { writeNotificationPref } from "@/lib/notifications/prefs";
import { readUnsubscribeToken } from "@/lib/notifications/tokens";
import { consumeRate } from "@/lib/rate-limit/limiter";

const TOKEN_PARAM = "token";

export async function POST(request: NextRequest) {
  const verdict = await consumeRate("unsubscribe", null);
  if (!verdict.ok) return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(verdict.retryAfter) } });
  const claims = readUnsubscribeToken(request.nextUrl.searchParams.get(TOKEN_PARAM) ?? "");
  if (!claims) return NextResponse.json({ ok: false }, { status: 400 });
  await writeNotificationPref(claims.personId, claims.category, false);
  return NextResponse.json({ ok: true });
}

export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get(TOKEN_PARAM) ?? "";
  return NextResponse.redirect(new URL(routes.unsubscribe(token), request.url));
}
