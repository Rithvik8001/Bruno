import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readServerEnv } from "./env";

let client: SupabaseClient | undefined;

export function supabaseAdmin(): SupabaseClient {
  if (client === undefined) {
    const env = readServerEnv();
    client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
