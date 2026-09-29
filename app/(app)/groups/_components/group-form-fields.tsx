"use client";

import { motion } from "motion/react";
import { hoverLift } from "@/components/motion/press";
import { GroupArtTile, Icon3d } from "@/components/ui/icon-3d";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { CurrencyCode } from "@/lib/currency";
import { GROUP_ART_IDS, groupArt, groupArtFor } from "@/lib/design-system/icons3d";
import { PALETTE_TINTS } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { currencyOptions, groupFormCopy, type GroupFormValue } from "../_data";

export type GroupFormErrors = Partial<Record<keyof GroupFormValue, string>>;

export interface GroupFormFieldsProps {
  value: GroupFormValue;
  onChange: (value: GroupFormValue) => void;
  errors?: GroupFormErrors;
  showCurrency?: boolean;
  currencyLocked?: boolean;
  autoFocus?: boolean;
}

export function GroupFormFields({
  value,
  onChange,
  errors = {},
  showCurrency = true,
  currencyLocked = false,
  autoFocus = false,
}: GroupFormFieldsProps) {
  const set = <K extends keyof GroupFormValue>(key: K, next: GroupFormValue[K]) => onChange({ ...value, [key]: next });
  const chosen = value.art ?? groupArtFor(value.name.trim());
  const copy = groupFormCopy;

  return (
    <div className="grid gap-5">
      <div className="flex items-end gap-3">
        <GroupArtTile
          name={value.name.trim() || copy.name.placeholder}
          art={chosen}
          tint={value.tint}
          size="lg"
          className="size-12 rounded-tile transition-colors"
        />
        <TextField
          label={copy.name.label}
          name="name"
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={40}
          placeholder={copy.name.placeholder}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          feedback={errors.name ? { tone: "error", message: errors.name } : undefined}
          fieldClassName="flex-1"
        />
      </div>

      <div className="grid gap-2">
        <span className="flex items-baseline justify-between text-small font-medium">
          {copy.icon.label}
          <span className="text-footnote font-normal text-muted">{value.art ? copy.icon.picked : copy.icon.auto}</span>
        </span>
        <div
          role="radiogroup"
          aria-label={copy.icon.label}
          className="-m-0.75 grid max-h-40.5 grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5 overflow-auto p-0.75"
        >
          {GROUP_ART_IDS.map((art) => {
            const on = chosen === art;
            return (
              <motion.button
                key={art}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={groupArt[art]}
                title={groupArt[art]}
                data-tint={on ? value.tint : undefined}
                onClick={() => set("art", value.art === art ? null : art)}
                {...hoverLift}
                className={cn(
                  "grid h-12 cursor-pointer place-items-center rounded-control transition-colors duration-200",
                  on ? "bg-tint-bg ring-2 ring-tint" : "bg-surface",
                )}
              >
                <Icon3d icon={art} size={30} />
              </motion.button>
            );
          })}
        </div>
      </div>

      <div role="radiogroup" aria-label={copy.colour.label} className="flex flex-wrap gap-2">
        {PALETTE_TINTS.map((tint) => (
          <motion.button
            key={tint}
            type="button"
            role="radio"
            aria-checked={value.tint === tint}
            aria-label={tint}
            data-tint={tint}
            onClick={() => set("tint", tint)}
            {...hoverLift}
            className={cn(
              "size-8 cursor-pointer rounded-full bg-tint transition-shadow",
              value.tint === tint && "ring-2 ring-tint ring-offset-2 ring-offset-bg",
            )}
          />
        ))}
      </div>

      {showCurrency && (
        <Select<CurrencyCode>
          label={groupFormCopy.currency.label}
          options={currencyOptions}
          value={value.currency}
          onValueChange={(currency) => set("currency", currency)}
          disabled={currencyLocked}
          feedback={errors.currency ? { tone: "error", message: errors.currency } : undefined}
        />
      )}
      {showCurrency && currencyLocked && <span className="-mt-3 text-footnote text-muted">{copy.currency.locked}</span>}
    </div>
  );
}
