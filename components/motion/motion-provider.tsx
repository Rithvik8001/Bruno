"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { EASE_TRANSITION } from "@/lib/motion/tokens";
import { ConfettiHost } from "./confetti-host";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={EASE_TRANSITION}>
      {children}
      <ConfettiHost />
    </MotionConfig>
  );
}
