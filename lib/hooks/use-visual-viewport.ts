"use client";

import { useSyncExternalStore } from "react";

export interface VisualViewportState {
  readonly height: number;
  readonly keyboardInset: number;
  readonly keyboardOpen: boolean;
}

const KEYBOARD_THRESHOLD = 120;

const listeners = new Set<() => void>();
let cached: VisualViewportState = { height: 0, keyboardInset: 0, keyboardOpen: false };
const server: VisualViewportState = cached;

function read(): VisualViewportState {
  const vv = window.visualViewport;
  if (!vv) return { height: window.innerHeight, keyboardInset: 0, keyboardOpen: false };
  const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  const next = { height: Math.round(vv.height), keyboardInset: inset, keyboardOpen: inset > KEYBOARD_THRESHOLD };
  if (next.height === cached.height && next.keyboardInset === cached.keyboardInset) return cached;
  cached = next;
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const vv = window.visualViewport;
  const notify = () => {
    read();
    listeners.forEach((l) => l());
  };
  vv?.addEventListener("resize", notify);
  vv?.addEventListener("scroll", notify);
  window.addEventListener("resize", notify);
  return () => {
    listeners.delete(listener);
    vv?.removeEventListener("resize", notify);
    vv?.removeEventListener("scroll", notify);
    window.removeEventListener("resize", notify);
  };
}

export function useVisualViewport(): VisualViewportState {
  return useSyncExternalStore(subscribe, read, () => server);
}
