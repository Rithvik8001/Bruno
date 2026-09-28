"use client";

import type { InputHTMLAttributes } from "react";
import { formatCents, parseDigitsToCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface MoneyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "type" | "inputMode"
  > {
  value: Cents | null;
  onValueChange: (value: Cents | null) => void;
  currencySymbol?: string;
  "aria-label": string;
}

export function MoneyInput({
  value,
  onValueChange,
  currencySymbol = "$",
  className,
  placeholder = "0.00",
  ...rest
}: MoneyInputProps) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-1.5 rounded-card bg-surface px-5 py-4 focus-within:shadow-[0_0_0_3px_var(--brand-tint)]",
        className,
      )}
    >
      <span aria-hidden className="text-[2rem] leading-10 font-semibold text-muted">
        {currencySymbol}
      </span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value === null ? "" : formatCents(value, "never")}
        onChange={(e) => onValueChange(parseDigitsToCents(e.target.value))}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-display outline-none focus-visible:outline-none"
      />
    </div>
  );
}
