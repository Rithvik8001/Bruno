"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Flash {
  readonly visible: boolean;
  readonly show: () => void;
}

export function useFlash(durationMs: number): Flash {
  const [visible, setVisible] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    setVisible(true);
    timer.current = window.setTimeout(() => setVisible(false), durationMs);
  }, [durationMs]);

  return { visible, show };
}
