"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Key, ReactNode } from "react";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export interface PopInProps {
  popKey: Key | null;
  children: ReactNode;
  className?: string;
}

export function PopIn({ popKey, children, className }: PopInProps) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {popKey !== null && (
        <motion.span
          key={popKey}
          className={cn("inline-flex", className)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: [0.8, 1.08, 1] }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: T.t1 } }}
          transition={{ duration: T.pop, ease: SPRING_CURVE, opacity: { duration: T.t1 } }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
