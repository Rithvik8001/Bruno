import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.client";
import { billTopic, type BillEvent, type ClaimSignal } from "./topics";

export async function broadcastBill(code: string, event: BillEvent, signal?: ClaimSignal): Promise<void> {
  const shared = publicEnv();
  if (!shared) return;
  const key = serverEnv().SUPABASE_SECRET_KEY ?? shared.supabasePublishableKey;
  const client = createClient(shared.supabaseUrl, key, {
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
