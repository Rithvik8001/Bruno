"use client";

import { useCallback, useState } from "react";
import { aiAllowance } from "@/lib/ai/actions";
import type { Allowance } from "@/lib/ai/rules";
import { browserTimeZone } from "@/lib/browser-time-zone";

export interface AllowanceState {
  readonly quota: Allowance;
  readonly setQuota: (quota: Allowance) => void;
  readonly refresh: () => Promise<void>;
}

export function useAllowance(initial: Allowance): AllowanceState {
  const [quota, setQuota] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setQuota(initial);
  }
  const refresh = useCallback(async () => {
    const result = await aiAllowance({ timeZone: browserTimeZone() }).catch(() => null);
    if (result?.ok) setQuota(result.data);
  }, []);
  return { quota, setQuota, refresh };
}
