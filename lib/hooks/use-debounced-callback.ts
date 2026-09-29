"use client";

import { useCallback, useEffect, useRef } from "react";

export interface DebouncedCallback<A extends readonly unknown[]> {
  readonly run: (...args: A) => void;
  readonly flush: () => void;
  readonly cancel: () => void;
}

export function useDebouncedCallback<A extends readonly unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): DebouncedCallback<A> {
  const latest = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<A | null>(null);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const args = pending.current;
    pending.current = null;
    if (args) latest.current(...args);
  }, []);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
  }, []);

  const run = useCallback(
    (...args: A) => {
      pending.current = args;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  useEffect(() => flush, [flush]);

  return { run, flush, cancel };
}
