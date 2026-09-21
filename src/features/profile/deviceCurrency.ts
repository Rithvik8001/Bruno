import { getLocales } from "expo-localization";

import { resolveCurrency } from "@/lib/money";

export function getDeviceCurrency(): string {
  try {
    return resolveCurrency(getLocales()[0]?.currencyCode);
  } catch {
    return resolveCurrency(null);
  }
}
