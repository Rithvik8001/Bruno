import { getCalendars } from "expo-localization";

export function getDeviceTimeZone(): string | null {
  try {
    const zone = getCalendars()[0]?.timeZone;
    if (typeof zone === "string" && zone.length > 0) {
      return zone;
    }
  } catch {}
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof resolved === "string" && resolved.length > 0 ? resolved : null;
  } catch {
    return null;
  }
}
