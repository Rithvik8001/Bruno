"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { currencySymbol, formatAmount, minorUnitsOf, type CurrencyCode } from "@/lib/currency";
import { parseDigitsToCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface MoneyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "type" | "inputMode"
  > {
  value: Cents | null;
  onValueChange: (value: Cents | null) => void;
  currency: CurrencyCode;
  trailing?: ReactNode;
  "aria-label": string;
}

export function MoneyInput({
  value,
  onValueChange,
  currency,
  trailing,
  className,
  placeholder,
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
        {currencySymbol(currency)}
      </span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? formatAmount(ZERO_CENTS, currency, "never")}
        value={value === null ? "" : formatAmount(value, currency, "never")}
        onChange={(e) => onValueChange(parseDigitsToCents(e.target.value, minorUnitsOf(currency) + 7))}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-display outline-none focus-visible:outline-none disabled:text-text"
      />
      {trailing}
    </div>
  );
}
