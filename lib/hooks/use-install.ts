"use client";

import { useSyncExternalStore } from "react";
import { canPromptInstall, promptInstall, subscribeInstallPrompt, type InstallOutcome } from "@/lib/pwa/install";
import { STANDALONE_QUERY } from "@/lib/pwa/platform";
import { useDevice } from "./use-device";
import { useMediaQuery } from "./use-media-query";

export type InstallRoute = "installed" | "prompt" | "ios" | "none";

export interface InstallControls {
  readonly route: InstallRoute | null;
  readonly install: () => Promise<InstallOutcome>;
}

export function useInstall(): InstallControls {
  const standalone = useMediaQuery(STANDALONE_QUERY);
  const promptable = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
  const device = useDevice();
  const ios = device === "iphone" || device === "ipad";
  const route: InstallRoute | null = device === null ? null : standalone ? "installed" : promptable ? "prompt" : ios ? "ios" : "none";
  return { route, install: promptInstall };
}
