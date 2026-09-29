"use client";

import { useRovingSelection } from "@/lib/hooks/use-roving-selection";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/ledger/rules";
import { cn } from "@/lib/utils/cn";
import { methodLabels, settleCopy } from "../_data";

export interface MethodChipsProps {
  value: PaymentMethod;
  onValueChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function MethodChips({ value, onValueChange, disabled = false }: MethodChipsProps) {
  const { register, onKeyDown } = useRovingSelection(PAYMENT_METHODS, value, onValueChange);
  return (
    <div className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{settleCopy.methodTitle}</span>
      <div role="radiogroup" aria-label={settleCopy.methodLabel} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((method) => {
          const selected = method === value;
          return (
            <button
              key={method}
              ref={register(method)}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onValueChange(method)}
              className={cn(
                "h-9 cursor-pointer rounded-control border px-3 text-footnote font-semibold",
                "transition-[background-color,border-color,color] duration-150 ease-standard disabled:cursor-default",
                selected ? "border-transparent bg-text text-bg" : "border-line bg-transparent text-text-2 hover:text-text",
              )}
            >
              {methodLabels[method]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
