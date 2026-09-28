"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TimelineOptions {
  steps: number;
  stepMs: number;
  delayMs?: number;
}

export function useTimeline({ steps, stepMs, delayMs = 0 }: TimelineOptions) {
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const start = useCallback(() => {
    clear();
    setProgress(0);
    for (let i = 1; i <= steps; i++) {
      timers.current.push(
        setTimeout(() => setProgress(Math.round((i / steps) * 100)), delayMs + i * stepMs),
      );
    }
  }, [clear, steps, stepMs, delayMs]);

  const reset = useCallback(() => {
    clear();
    setProgress(null);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { progress, start, reset, running: progress !== null && progress < 100 };
}
