import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { runDigests } from "@/lib/notifications/digests/run";

export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runDigests()) });
}
