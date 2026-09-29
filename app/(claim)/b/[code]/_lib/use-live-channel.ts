"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { realtimeClient } from "@/lib/realtime/client";
import { BILL_EVENTS, billTopic, isClaimSignal, type ClaimSignal } from "@/lib/realtime/topics";

export interface PresentPerson {
  readonly id: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
}

const REFRESH_DEBOUNCE_MS = 150;

function isPresent(value: unknown): value is PresentPerson {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string" && typeof v.tint === "string";
}

export interface LiveChannel {
  readonly connected: boolean;
  readonly present: readonly PresentPerson[];
}

export function useLiveChannel(
  code: string,
  me: PresentPerson | null,
  onSignal: (signal: ClaimSignal) => void,
): LiveChannel {
  const router = useRouter();
  const [present, setPresent] = useState<readonly PresentPerson[]>([]);
  const [connected, setConnected] = useState(false);
  const signalRef = useRef(onSignal);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meId = me?.id ?? null;
  const meRef = useRef(me);

  useEffect(() => {
    meRef.current = me;
    signalRef.current = onSignal;
  }, [me, onSignal]);

  useEffect(() => {
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const client = realtimeClient();
    const channel = client?.channel(billTopic(code), { config: { presence: { key: meId ?? "" } } });
    if (channel) {
      for (const event of BILL_EVENTS) {
        channel.on("broadcast", { event }, (message: { payload?: unknown }) => {
          if (isClaimSignal(message.payload)) signalRef.current(message.payload);
          refresh();
        });
      }
      channel.on("presence", { event: "sync" }, () => {
        const seen = new Map<string, PresentPerson>();
        for (const entries of Object.values(channel.presenceState())) {
          for (const entry of entries) if (isPresent(entry)) seen.set(entry.id, entry);
        }
        setPresent([...seen.values()]);
      });
      channel.subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        const current = meRef.current;
        if (status === "SUBSCRIBED" && current) void channel.track({ ...current });
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current) clearTimeout(timer.current);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [code, meId, router]);

  return { connected, present };
}
