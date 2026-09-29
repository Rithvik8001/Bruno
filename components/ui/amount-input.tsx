"use client";

import { useState, type InputHTMLAttributes } from "react";
import { formatAmount, isAmountText, minorUnitsOf, parseAmount, type CurrencyCode } from "@/lib/currency";
import { ZERO_CENTS, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "inputMode"> {
  value: Cents | null;
  onValueChange: (value: Cents | null) => void;
  currency: CurrencyCode;
  "aria-label": string;
  tone?: "default" | "positive";
  flagged?: boolean;
}

export const ghostInputClassName = cn(
  "h-9 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-2.5 font-medium text-text outline-none placeholder:text-muted",
  "transition-[background-color,border-color] duration-150 ease-standard hover:bg-bg focus:border-brand focus:bg-bg",
);

const display = (value: Cents | null, currency: CurrencyCode) => (value === null ? "" : formatAmount(value, currency, "never"));

export function AmountInput({
  value,
  onValueChange,
  currency,
  tone = "default",
  flagged = false,
  className,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}: AmountInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const minorUnits = minorUnitsOf(currency);

  return (
    <input
      {...rest}
      type="text"
      inputMode={minorUnits > 0 ? "decimal" : "numeric"}
      autoComplete="off"
      placeholder={placeholder ?? formatAmount(ZERO_CENTS, currency, "never")}
      value={draft ?? display(value, currency)}
      onFocus={(e) => {
        setDraft(display(value, currency).replace(/,/g, ""));
        onFocus?.(e);
      }}
      onChange={(e) => {
        const text = e.target.value;
        if (!isAmountText(text, currency)) return;
        const parsed = parseAmount(text, currency);
        if (parsed === null && /\d/.test(text)) return;
        setDraft(text);
        onValueChange(parsed);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
      className={cn(
        ghostInputClassName,
        "text-right font-semibold",
        tone === "positive" && "text-green",
        flagged && "border-amber bg-bg",
        className,
      )}
    />
  );
}
