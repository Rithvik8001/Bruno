"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <motion.span
      role="status"
      aria-label={label}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
      className={cn("inline-block size-4 rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
