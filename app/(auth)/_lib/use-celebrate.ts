"use client";

import { useEffect, useRef, type RefObject } from "react";
import { fireConfetti } from "@/lib/motion/confetti";

export function useCelebrateOnMount<T extends Element>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !ref.current) return;
    fired.current = true;
    fireConfetti(ref.current);
  }, []);

  return ref;
}
