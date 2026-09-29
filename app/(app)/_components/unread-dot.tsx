"use client";

import { motion } from "motion/react";
import { SPRING_CURVE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { shellCopy } from "../_data";

const APPEAR_DELAY = 0.9;

export function UnreadDot({ className }: { className?: string }) {
  return (
    <>
      <span className="sr-only">{shellCopy.unread}</span>
      <motion.span
        aria-hidden
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ duration: 0.46, ease: SPRING_CURVE, delay: APPEAR_DELAY }}
        className={cn("pointer-events-none absolute size-2 rounded-full bg-red ring-2 ring-bg", className)}
      />
    </>
  );
}
