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
  className?: string;
}

const stepButton =
  "grid h-10.5 w-11 cursor-pointer place-items-center rounded-sm bg-transparent transition-[background-color] duration-150 ease-standard hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent";

export function Stepper({ value, onValueChange, min = 1, max = 12, label, className }: StepperProps) {
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
    <div
      className={cn("inline-flex h-12 items-center gap-0.5 rounded-control bg-surface p-0.75", className)}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fewer"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className={stepButton}
      >
        <Icon name="minus" size={18} strokeWidth={2} />
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={onKeyDown}
        className="min-w-11 rounded-xs text-center font-semibold"
      >
        {value}
      </span>
      <button
        type="button"
        tabIndex={-1}
        aria-label="More"
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className={stepButton}
      >
        <Icon name="plus" size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
