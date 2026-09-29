"use client";

import type { KeyboardEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";

export interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: StepperSize;
  className?: string;
}

type StepperSize = "sm" | "md";

const trackSize = {
  md: "h-12 gap-0.5 rounded-control bg-surface p-0.75",
  sm: "h-9 gap-0 rounded-sm bg-bg p-0.5",
} as const satisfies Record<StepperSize, string>;

const buttonSize = {
  md: "h-10.5 w-11 rounded-sm hover:bg-surface-2",
  sm: "size-8 rounded-xs text-text-2 hover:bg-surface",
} as const satisfies Record<StepperSize, string>;

const valueSize = {
  md: "min-w-11",
  sm: "min-w-7 text-small",
} as const satisfies Record<StepperSize, string>;

const stepButton =
  "grid cursor-pointer place-items-center bg-transparent transition-[background-color] duration-150 ease-standard disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent";

export function Stepper({ value, onValueChange, min = 1, max = 12, label, size = "md", className }: StepperProps) {
  const set = (n: number) => onValueChange(Math.min(max, Math.max(min, n)));

  const onKeyDown = (e: KeyboardEvent) => {
    const next: Record<string, number> = {
      ArrowUp: value + 1,
      ArrowRight: value + 1,
      ArrowDown: value - 1,
      ArrowLeft: value - 1,
      Home: min,
      End: max,
    };
    const n = next[e.key];
    if (n === undefined) return;
    e.preventDefault();
    set(n);
  };

  return (
    <div className={cn("inline-flex items-center", trackSize[size], className)}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fewer"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className={cn(stepButton, buttonSize[size])}
      >
        <Icon name="minus" size={size === "sm" ? 14 : 18} strokeWidth={2.2} />
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={onKeyDown}
        className={cn("rounded-xs text-center font-semibold", valueSize[size])}
      >
        {value}
      </span>
      <button
        type="button"
        tabIndex={-1}
        aria-label="More"
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className={cn(stepButton, buttonSize[size])}
      >
        <Icon name="plus" size={size === "sm" ? 14 : 18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
