"use client";

import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import type { Key, ReactNode } from "react";
import { EASE, T } from "@/lib/motion/tokens";

export interface RiseProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate"> {
  delay?: number;
}

export function Rise({ delay = 0, transition, ...rest }: RiseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: T.t1, ease: EASE } }}
      transition={{ duration: T.t3, ease: EASE, delay, ...transition }}
      {...rest}
    />
  );
}

export interface StepSwapProps {
  stepKey: Key;
  children: ReactNode;
  className?: string;
}

export function StepSwap({ stepKey, children, className }: StepSwapProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Rise key={stepKey} className={className}>
        {children}
      </Rise>
    </AnimatePresence>
  );
}

export interface PrintInProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate"> {
  index?: number;
}

export function PrintIn({ index = 0, transition, ...rest }: PrintInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: T.t2, ease: EASE, delay: index * 0.06, ...transition }}
      {...rest}
    />
  );
}
