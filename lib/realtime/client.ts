"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env.client";

let client: SupabaseClient | null | undefined;

export function realtimeClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const env = publicEnv();
  client = env
    ? createClient(env.supabaseUrl, env.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return client;
}
