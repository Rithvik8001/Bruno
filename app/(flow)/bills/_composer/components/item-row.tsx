"use client";

import { useState } from "react";
import { AmountInput, ghostInputClassName } from "@/components/ui/amount-input";
import { IconButton } from "@/components/ui/icon-button";
import { ITEM_NAME_MAX, ITEM_QUANTITY_MAX } from "@/lib/bills/schema";
import type { CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils/cn";
import { composerCopy } from "../data";
import type { DraftItem } from "../lib/draft";

export const itemGridClassName = "grid grid-cols-[minmax(0,1fr)_48px_96px_36px] items-center gap-1.5";

export interface ItemRowProps {
  item: DraftItem;
  currency: CurrencyCode;
  onChange: (patch: Partial<Omit<DraftItem, "key">>) => void;
  onRemove: () => void;
}

function QuantityInput({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={composerCopy.items.quantity}
      value={text ?? String(value)}
      onFocus={() => setText(String(value))}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
        setText(digits);
        const n = Number(digits);
        if (n >= 1 && n <= ITEM_QUANTITY_MAX) onValueChange(n);
      }}
      onBlur={() => setText(null)}
      className={cn(ghostInputClassName, "px-0 text-center text-text-2 focus:text-text")}
    />
  );
}

export function ItemRow({ item, currency, onChange, onRemove }: ItemRowProps) {
  const copy = composerCopy.items;
  return (
    <div className="animate-print-in border-t border-line py-2">
      <div className={itemGridClassName}>
        <input
          type="text"
          value={item.name}
          maxLength={ITEM_NAME_MAX}
          placeholder={copy.itemPlaceholder}
          aria-label={copy.itemName}
          onChange={(e) => onChange({ name: e.target.value })}
          className={ghostInputClassName}
        />
        <QuantityInput value={item.quantity} onValueChange={(quantity) => onChange({ quantity })} />
        <AmountInput
          value={item.price}
          onValueChange={(price) => onChange({ price })}
          currency={currency}
          aria-label={copy.price}
        />
        <IconButton
          icon="close"
          label={copy.remove(item.name.trim())}
          onClick={onRemove}
          className="size-9 rounded-sm text-muted hover:bg-red-bg hover:text-red"
        />
      </div>
    </div>
  );
}
