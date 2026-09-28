"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  className?: string;
}

const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  invalid = false,
  disabled = false,
  autoFocus = false,
  label = "Verification code",
  className,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusAt = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string, focusIndex: number) => {
    const clean = digitsOnly(next).slice(0, length);
    onChange(clean);
    focusAt(focusIndex);
    if (clean.length === length) onComplete?.(clean);
  };

  const writeAt = (index: number, typed: string) => {
    const incoming = digitsOnly(typed);
    if (!incoming) return;
    const chars = slots.slice();
    incoming
      .slice(0, length - index)
      .split("")
      .forEach((c, k) => {
        chars[index + k] = c;
      });
    const filled = chars.join("");
    commit(filled, Math.min(length - 1, index + incoming.length));
  };

  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = slots.slice();
      const target = chars[index] ? index : index - 1;
      if (target < 0) return;
      chars[target] = "";
      onChange(chars.join("").slice(0, target) + chars.slice(target + 1).join(""));
      focusAt(target);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const onPaste = (index: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    writeAt(index, e.clipboardData.getData("text"));
  };

  return (
    <div role="group" aria-label={label} className={cn("flex justify-center gap-2.5", className)}>
      {slots.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => writeAt(i, e.target.value.replace(digit, "") || e.target.value)}
          onKeyDown={onKeyDown(i)}
          onPaste={onPaste(i)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-14 w-12 rounded-[12px] border p-0 text-center text-[1.5rem] font-semibold outline-none",
            "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
            "focus:border-brand focus:bg-bg focus:shadow-[0_0_0_3px_var(--brand-tint)]",
            "disabled:cursor-not-allowed disabled:text-muted",
            invalid ? "border-red bg-bg" : digit ? "border-border bg-bg" : "border-transparent bg-surface",
          )}
        />
      ))}
    </div>
  );
}
