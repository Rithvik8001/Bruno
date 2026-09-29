"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SOFT_SPRING } from "@/lib/motion/tokens";
import { useRovingSelection } from "@/lib/hooks/use-roving-selection";
import { cn } from "@/lib/utils/cn";

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: ReactNode;
  readonly controls?: string;
}

interface SegmentedBaseProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}

type Size = "sm" | "md" | "lg";

const trackClass = {
  sm: "inline-flex",
  md: "inline-flex",
  lg: "flex h-11 w-full",
} as const satisfies Record<Size, string>;

const itemClass = {
  sm: "h-7.5 px-3 text-footnote",
  md: "h-9 px-3.5 text-small",
  lg: "flex-1 text-small",
} as const satisfies Record<Size, string>;

const thumbClass = (selected: boolean, size: Size) =>
  cn(
    "relative cursor-pointer rounded-sm bg-transparent font-medium transition-colors duration-150 ease-standard",
    itemClass[size],
    selected ? "text-text" : "text-text-2 hover:text-text",
  );

function SegmentGroup<T extends string>({
  options,
  value,
  onValueChange,
  label,
  className,
  size,
  role,
}: SegmentedBaseProps<T> & { size: Size; role: "radiogroup" | "tablist" }) {
  const values = options.map((o) => o.value);
  const thumbId = useId();
  const select = (next: T) => {
    if (next !== value) buzz(HAPTICS.select);
    onValueChange(next);
  };
  const { register, onKeyDown } = useRovingSelection(values, value, select);
  const itemRole = role === "tablist" ? "tab" : "radio";

  return (
    <div
      role={role}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("isolate gap-0.5 rounded-control bg-surface p-0.75", trackClass[size], className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={register(o.value)}
            type="button"
            role={itemRole}
            tabIndex={selected ? 0 : -1}
            {...(itemRole === "tab"
              ? { "aria-selected": selected, "aria-controls": o.controls }
              : { "aria-checked": selected })}
            onClick={() => select(o.value)}
            className={thumbClass(selected, size)}
          >
            {selected && (
              <motion.span
                layoutId={thumbId}
                aria-hidden
                transition={SOFT_SPRING}
                className="absolute inset-0 -z-10 rounded-sm bg-bg shadow-thumb"
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SegmentedControlProps<T extends string> extends SegmentedBaseProps<T> {
  size?: Exclude<Size, "md">;
}

export function SegmentedControl<T extends string>({ size = "lg", ...props }: SegmentedControlProps<T>) {
  return <SegmentGroup {...props} size={size} role="radiogroup" />;
}

export function Tabs<T extends string>(props: SegmentedBaseProps<T>) {
  return <SegmentGroup {...props} size="md" role="tablist" />;
}
