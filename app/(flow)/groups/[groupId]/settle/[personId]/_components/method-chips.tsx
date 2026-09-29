"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { pressMotion } from "@/components/motion/press";
import { useRovingSelection } from "@/lib/hooks/use-roving-selection";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/ledger/rules";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SOFT_SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { methodLabels, settleCopy } from "../_data";

export interface MethodChipsProps {
  value: PaymentMethod;
  onValueChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function MethodChips({ value, onValueChange, disabled = false }: MethodChipsProps) {
  const thumbId = useId();
  const { register, onKeyDown } = useRovingSelection(PAYMENT_METHODS, value, onValueChange);
  return (
    <div className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{settleCopy.methodTitle}</span>
      <div role="radiogroup" aria-label={settleCopy.methodLabel} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((method) => {
          const selected = method === value;
          return (
            <motion.button
              key={method}
              ref={register(method)}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                if (!selected) buzz(HAPTICS.select);
                onValueChange(method);
              }}
              {...(disabled ? {} : pressMotion())}
              className={cn(
                "relative isolate h-9 cursor-pointer rounded-control border px-3 text-footnote font-semibold",
                "transition-[border-color,color] duration-150 ease-standard disabled:cursor-default",
                selected ? "border-transparent text-bg" : "border-line bg-transparent text-text-2 hover:text-text",
              )}
            >
              {selected && (
                <motion.span
                  aria-hidden
                  layoutId={thumbId}
                  transition={SOFT_SPRING}
                  className="absolute -inset-px -z-10 rounded-control bg-text"
                />
              )}
              {methodLabels[method]}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
