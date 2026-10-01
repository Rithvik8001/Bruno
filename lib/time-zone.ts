import "server-only";
import { cookies } from "next/headers";
import { TIME_ZONE_COOKIE } from "./time-zone-cookie";
import { timeZoneSchema } from "@/lib/scans/schema";

export async function cookieTimeZone(): Promise<string | null> {
  const raw = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  if (!raw) return null;
  const parsed = timeZoneSchema.safeParse(decodeURIComponent(raw));
  return parsed.success ? parsed.data : null;
}
