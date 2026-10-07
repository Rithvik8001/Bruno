"use client";

import { useSyncExternalStore } from "react";
import { canPromptInstall, promptInstall, subscribeInstallPrompt, type InstallOutcome } from "@/lib/pwa/install";
import { isIosDevice, STANDALONE_QUERY } from "@/lib/pwa/platform";
import { useMediaQuery } from "./use-media-query";

export type InstallRoute = "installed" | "prompt" | "ios" | "none";

export interface InstallControls {
  readonly route: InstallRoute;
  readonly install: () => Promise<InstallOutcome>;
}

export function useInstall(): InstallControls {
  const standalone = useMediaQuery(STANDALONE_QUERY);
  const promptable = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
  const ios = useSyncExternalStore(
    () => () => undefined,
    () => isIosDevice(navigator),
    () => false,
  );
  const route: InstallRoute = standalone ? "installed" : promptable ? "prompt" : ios ? "ios" : "none";
  return { route, install: promptInstall };
}
