"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";
import { FlaggedGuesses } from "@/components/patterns/flagged-line";
import { pressMotion } from "@/components/motion/press";
import { AmountInput, ghostInputClassName } from "@/components/ui/amount-input";
import { IconButton } from "@/components/ui/icon-button";
import { ITEM_NAME_MAX, ITEM_QUANTITY_MAX } from "@/lib/bills/schema";
import type { ItemCategory } from "@/lib/bills/types";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, SPRING, T } from "@/lib/motion/tokens";
import { categoryLabel, categoryTint } from "@/lib/scans/categories";
import { cn } from "@/lib/utils/cn";
import { composerCopy } from "../data";
import type { DraftItem } from "../lib/draft";
import { isFlagged } from "../lib/scan";

export const itemGridClassName = "hidden sm:grid sm:grid-cols-[minmax(0,1fr)_48px_96px_36px] sm:items-center sm:gap-1.5";

const rowGridClassName = "grid gap-1 sm:grid-cols-[minmax(0,1fr)_48px_96px_36px] sm:items-center sm:gap-1.5";

const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  shown: { height: "auto", opacity: 1, transition: { height: { duration: T.t2, ease: EASE }, opacity: { duration: T.t2, ease: EASE } } },
  gone: { height: 0, opacity: 0, transition: { height: { duration: T.t3, ease: EASE }, opacity: { duration: T.t1, ease: EASE } } },
};

const arrive: Variants = {
  hidden: { scale: 0.96 },
  shown: { scale: 1, transition: SPRING },
  gone: { scale: 0.96, transition: { duration: T.t1, ease: EASE } },
};

const FADE = { duration: T.t3, ease: EASE } as const;

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
      className={cn(ghostInputClassName, "px-0 text-center text-text-2 focus:text-text pointer-coarse:h-11")}
    />
  );
}

interface CategoryChipsProps {
  name: string;
  picked: ItemCategory | null;
  options: readonly ItemCategory[];
  onPick: (category: ItemCategory) => void;
}

function CategoryChips({ name, picked, options, onPick }: CategoryChipsProps) {
  return (
    <div role="radiogroup" aria-label={composerCopy.items.categoryLabel(name)} className="flex flex-wrap gap-1.5 pl-1">
      {options.map((option) => {
        const on = option === picked;
        return (
          <motion.button
            key={option}
            type="button"
            role="radio"
            aria-checked={on}
            data-tint={on ? categoryTint[option] : "muted"}
            onClick={() => {
              if (on) return;
              buzz(HAPTICS.select);
              onPick(option);
            }}
            {...pressMotion()}
            className={cn(
              "relative inline-flex h-5.5 cursor-pointer items-center rounded-xs px-1.75 text-[11px] font-semibold leading-none",
              "before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']",
              "transition-[background-color,color] duration-150 ease-standard",
              on ? "bg-tint-bg text-tint" : "bg-transparent text-muted hover:bg-surface-2",
            )}
          >
            {categoryLabel[option]}
          </motion.button>
        );
      })}
    </div>
  );
}

export function ItemRow({ item, currency, onChange, onRemove }: ItemRowProps) {
  const copy = composerCopy.items;
  const flagged = isFlagged(item);
  const categories = item.hints?.categories ?? [];
  const showCategories = categories.length > 1 || (categories.length === 1 && item.category === null);
  return (
    <motion.div variants={collapse} initial="hidden" animate="shown" exit="gone" className="-mx-1 overflow-hidden px-1">
      <motion.div
        variants={arrive}
        data-tint="amber"
        className={cn(
          "grid gap-2 border-t py-2 transition-[background-color,border-color] duration-220 ease-standard",
          flagged ? "-mx-2.5 my-1 rounded-[12px] border-transparent bg-tint-bg px-2.5" : "border-line",
        )}
      >
        <div className={rowGridClassName}>
          <input
            type="text"
            value={item.name}
            maxLength={ITEM_NAME_MAX}
            placeholder={copy.itemPlaceholder}
            aria-label={copy.itemName}
            onChange={(e) => onChange({ name: e.target.value })}
            className={cn(ghostInputClassName, "pointer-coarse:h-11")}
          />
          <div className="grid grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-1.5 sm:contents">
            <QuantityInput value={item.quantity} onValueChange={(quantity) => onChange({ quantity })} />
            <AmountInput
              value={item.price}
              onValueChange={(price) => onChange({ price })}
              currency={currency}
              aria-label={copy.price}
              flagged={flagged}
              placeholder={flagged ? copy.noTotal : undefined}
              className="pointer-coarse:h-11"
            />
            <IconButton
              icon="close"
              label={copy.remove(item.name.trim())}
              onClick={onRemove}
              className="size-9 justify-self-end rounded-sm text-muted hover:bg-red-bg hover:text-red pointer-coarse:size-11"
            />
          </div>
        </div>
        {showCategories && (
          <CategoryChips name={item.name.trim()} picked={item.category} options={categories} onPick={(category) => onChange({ category })} />
        )}
        <AnimatePresence initial={false}>
          {flagged && item.hints && (
            <motion.div
              key="guesses"
              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
              animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
              transition={FADE}
            >
              <FlaggedGuesses
                guesses={item.hints.guesses}
                onPick={(price) => onChange({ price })}
                format={(value) => formatMoney(value, currency)}
                prompt={copy.guessPrompt}
                trailing={copy.orType}
                className="pl-1"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
