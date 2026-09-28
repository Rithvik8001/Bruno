"use client";

import type { ReactNode } from "react";
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
    "cursor-pointer rounded-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-standard",
    itemClass[size],
    selected ? "bg-bg text-text shadow-thumb" : "bg-transparent text-text-2 hover:text-text",
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
  const { register, onKeyDown } = useRovingSelection(values, value, onValueChange);
  const itemRole = role === "tablist" ? "tab" : "radio";

  return (
    <div
      role={role}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("gap-0.5 rounded-control bg-surface p-0.75", trackClass[size], className)}
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
            onClick={() => onValueChange(o.value)}
            className={thumbClass(selected, size)}
          >
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
