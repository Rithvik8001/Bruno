"use client";

import { useCallback, useEffect, useState } from "react";

export interface Cooldown {
  readonly remaining: number;
  readonly active: boolean;
  readonly restart: (seconds?: number) => void;
}

export function useCooldown(seconds: number, startActive = true): Cooldown {
  const [remaining, setRemaining] = useState(startActive ? seconds : 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const restart = useCallback((next?: number) => setRemaining(next ?? seconds), [seconds]);

  return { remaining, active: remaining > 0, restart };
}
