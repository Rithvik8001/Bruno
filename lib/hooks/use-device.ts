"use client";

import { useSyncExternalStore } from "react";
import { deviceKind, type DeviceKind } from "@/lib/pwa/platform";

const noop = () => () => undefined;

export function useDevice(): DeviceKind | null {
  return useSyncExternalStore(
    noop,
    () => deviceKind(navigator),
    () => null,
  );
}
