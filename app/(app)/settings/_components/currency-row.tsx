"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/toast";
import { currencyOptions, currencySymbol, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { saveDefaultCurrency } from "@/lib/people/actions";
import { settingsCopy } from "../_data";

const copy = settingsCopy.currency;

export function CurrencyRow({ initial }: { initial: CurrencyCode }) {
  const { toast } = useToast();
  const id = useId();
  const [currency, setCurrency] = useState(initial);

  const pick = async (next: CurrencyCode) => {
    const previous = currency;
    setCurrency(next);
    const result = await saveDefaultCurrency({ currency: next }).catch(() => null);
    if (result?.ok) return;
    setCurrency(previous);
    toast({ message: result?.error.message ?? copy.failed });
  };

  return (
    <div className="flex min-h-15 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="grid gap-0.5">
        <span className="font-medium">{copy.label}</span>
        <span className="text-footnote text-text-2">{copy.sub}</span>
      </label>
      <span className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-control bg-bg px-3 text-small font-medium transition-[background-color] duration-150 ease-standard hover:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand pointer-coarse:h-11">
        <span aria-hidden>{`${currency} · ${currencySymbol(currency)}`}</span>
        <Icon name="chevron-down" size={16} className="text-muted" />
        <select
          id={id}
          value={currency}
          onChange={(event) => {
            if (isCurrencyCode(event.target.value)) void pick(event.target.value);
          }}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
