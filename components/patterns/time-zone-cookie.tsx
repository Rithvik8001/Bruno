"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const TIME_ZONE_COOKIE = "bruno_tz";

const YEAR_SECONDS = 365 * 24 * 60 * 60;

export interface TimeZoneCookieProps {
  serverTimeZone: string | null;
}

export function TimeZoneCookie({ serverTimeZone }: TimeZoneCookieProps) {
  const router = useRouter();
  useEffect(() => {
    let zone = "UTC";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    if (zone === serverTimeZone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }, [router, serverTimeZone]);
  return null;
}
