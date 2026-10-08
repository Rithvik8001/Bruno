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
  pending?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, children, disabled = false, pending = false, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pending ? "mixed" : checked}
      aria-busy={pending || undefined}
      disabled={disabled}
      onClick={() => {
        if (pending) return;
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
          "relative h-6.5 w-11 shrink-0 rounded-full transition-[background-color,box-shadow,opacity] duration-200 ease-standard",
          checked || pending ? "bg-brand skin-key-primary shadow-key-primary" : "bg-tray shadow-track",
          pending && "opacity-70",
        )}
      >
        <motion.span
          initial={false}
          animate={{ x: pending ? KNOB_TRAVEL / 2 : checked ? KNOB_TRAVEL : 0 }}
          transition={SPRING}
          className="absolute top-0.75 left-0.75 size-5 rounded-full bg-thumb shadow-card-thumb"
        />
      </span>
    </button>
  );
}
