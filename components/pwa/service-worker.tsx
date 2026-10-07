"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/pwa/install";
import { serviceWorkerEnabled } from "@/lib/pwa/platform";

const SCRIPT = "/sw.js";

if (typeof window !== "undefined") listenForInstallPrompt();

export function ServiceWorker() {
  useEffect(() => {
    if (!serviceWorkerEnabled()) return;
    navigator.serviceWorker.register(SCRIPT, { scope: "/", updateViaCache: "none" }).catch((error: unknown) => {
      console.error("[sw] register failed", error);
    });
  }, []);
  return null;
}
