"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

const KNOB_TRAVEL = 18;

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, children, disabled = false, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        buzz(HAPTICS.select);
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex min-h-touch w-full cursor-pointer items-center justify-between gap-4 bg-transparent text-left disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span className="min-w-0">{children}</span>
      <span
        aria-hidden
        className={cn(
          "relative h-6.5 w-11 shrink-0 rounded-full transition-colors duration-200 ease-standard",
          checked ? "bg-brand" : "bg-border",
        )}
      >
        <motion.span
          initial={false}
          animate={{ x: checked ? KNOB_TRAVEL : 0 }}
          transition={SPRING}
          className="absolute top-0.75 left-0.75 size-5 rounded-full bg-white shadow-thumb"
        />
      </span>
    </button>
  );
}
