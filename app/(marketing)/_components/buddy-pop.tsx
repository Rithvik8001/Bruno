"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";

export type PopTrigger = "mount" | "view";

const HIDDEN = { scale: 0.3, opacity: 0 };
const SHOWN = { scale: [0.3, 1.12, 1], opacity: 1 };
const STAGGER = 0.09;

export interface BuddyPopProps {
  trigger: PopTrigger;
  index?: number;
  className?: string;
  children: ReactNode;
}

export function BuddyPop({ trigger, index = 0, className, children }: BuddyPopProps) {
  const transition = { duration: T.pop, ease: SPRING_CURVE, delay: index * STAGGER };
  return (
    <motion.span
      className={className}
      initial={HIDDEN}
      {...(trigger === "mount" ? { animate: SHOWN } : { whileInView: SHOWN, viewport: { once: true, amount: 0.6 } })}
      transition={transition}
    >
      {children}
    </motion.span>
  );
}
