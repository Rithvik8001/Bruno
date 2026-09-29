"use client";

import { motion } from "motion/react";
import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SPRING_CURVE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export function CheckIndicator({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={checked ? { scale: [0.7, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.42, ease: SPRING_CURVE }}
      className={cn(
        "grid size-5.5 shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-[background-color,border-color] duration-150 ease-standard",
        checked ? "border-brand bg-brand" : "border-border bg-transparent",
        className,
      )}
    >
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <motion.path
          d="M5 12l5 5L20 7"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ pathLength: { duration: 0.36, delay: 0.06 }, opacity: { duration: 0.1 } }}
        />
      </svg>
    </motion.span>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  children: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ children, className, disabled, checked, defaultChecked, onChange, ...rest }: CheckboxProps) {
  const [own, setOwn] = useState(defaultChecked ?? false);
  const on = checked ?? own;
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-1 transition-[background-color] duration-150 ease-standard hover:bg-surface",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
        disabled && "cursor-not-allowed text-muted hover:bg-transparent",
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        disabled={disabled}
        checked={on}
        onChange={(e) => {
          setOwn(e.target.checked);
          if (e.target.checked) buzz(HAPTICS.select);
          onChange?.(e);
        }}
        {...rest}
      />
      <CheckIndicator checked={on} className={disabled ? "border-transparent bg-surface-2" : undefined} />
      <span>{children}</span>
    </label>
  );
}
