import { createClient, type Session } from "@supabase/supabase-js";
import { AppState } from "react-native";

import type { Database } from "./database.types";
import { sessionStorage } from "./sessionStorage";
import { timeoutFetch } from "./timeoutFetch";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (url === undefined || publishableKey === undefined) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY",
  );
}

const storageKey = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: sessionStorage,
    storageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: timeoutFetch },
});

function isStoredSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.access_token === "string" &&
    typeof candidate.refresh_token === "string" &&
    typeof candidate.user?.id === "string"
  );
}

export async function readStoredSession(): Promise<Session | null> {
  try {
    const stored = await sessionStorage.getItem(storageKey);
    if (stored === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(stored);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
