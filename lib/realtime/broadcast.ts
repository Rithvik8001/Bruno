import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.client";
import { billTopic, type BillEvent, type ClaimSignal } from "./topics";

export async function broadcastBill(code: string, event: BillEvent, signal?: ClaimSignal): Promise<void> {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = serverEnv();
  const shared = publicEnv();
  const url = SUPABASE_URL ?? shared?.supabaseUrl;
  const key = SUPABASE_SECRET_KEY ?? shared?.supabasePublishableKey;
  if (!url || !key) return;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const channel = client.channel(billTopic(code));
  try {
    await channel.httpSend(event, signal ?? { at: Date.now() });
  } catch (error) {
    console.error("[realtime] broadcast failed", error);
  } finally {
    await client.removeChannel(channel);
  }
}
