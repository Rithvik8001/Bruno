"use client";

import { useCallback, useEffect, useRef } from "react";

const CLEAR_AFTER_MS = 520;

export function useWrongCodeReset(clear: () => void) {
  const groupRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      clear();
      groupRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }, CLEAR_AFTER_MS);
  }, [clear]);

  const cancel = useCallback(() => window.clearTimeout(timer.current), []);

  return { groupRef, scheduleReset: schedule, cancelReset: cancel };
}
