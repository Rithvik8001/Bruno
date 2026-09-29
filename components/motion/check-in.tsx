"use client";

import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import type { Key, ReactNode } from "react";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";

export function CheckIn({ transition, ...rest }: Omit<HTMLMotionProps<"span">, "initial" | "animate">) {
  return (
    <motion.span
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: [0, 1.2, 1], rotate: [-30, 6, 0] }}
      transition={{ duration: T.pop, ease: SPRING_CURVE, ...transition }}
      {...rest}
    />
  );
}

export interface PopSwapProps {
  swapKey: Key;
  children: ReactNode;
  className?: string;
}

export function PopSwap({ swapKey, children, className }: PopSwapProps) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={swapKey}
        className={className}
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: [0.6, 1.12, 1], rotate: [-12, 4, 0] }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
        transition={{ duration: 0.48, ease: SPRING_CURVE }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
