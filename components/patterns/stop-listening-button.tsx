"use client";

import { motion } from "motion/react";
import { pressMotion } from "@/components/motion/press";
import { EASE } from "@/lib/motion/tokens";

const RING = { duration: 1.4, ease: EASE, repeat: Infinity } as const;
const BAR = { duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } as const;
const BARS = [0, 0.15, 0.3] as const;

export interface StopListeningButtonProps {
  label: string;
  ariaLabel: string;
  onStop: () => void;
}

export function StopListeningButton({ label, ariaLabel, onStop }: StopListeningButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onStop}
      aria-label={ariaLabel}
      {...pressMotion()}
      className="relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-brand pr-4 pl-3 text-small font-semibold text-on-brand hover:bg-brand-hover"
    >
      {[0, 0.7].map((delay) => (
        <motion.span
          key={delay}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.25 }}
          transition={{ ...RING, delay }}
        />
      ))}
      <span aria-hidden className="flex h-4 items-center gap-0.5">
        {BARS.map((delay) => (
          <motion.span
            key={delay}
            className="h-4 w-0.75 rounded-full bg-current"
            initial={{ scaleY: 0.35 }}
            animate={{ scaleY: 1 }}
            transition={{ ...BAR, delay }}
          />
        ))}
      </span>
      {label}
    </motion.button>
  );
}
