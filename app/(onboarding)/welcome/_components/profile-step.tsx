"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { BUDDY_SHAPES, buddyShapes, type BuddyShape } from "@/lib/design-system/buddies";
import { PALETTE_TINTS, type PaletteTint } from "@/lib/design-system/tokens";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { welcomeCopy } from "../_data";
import { ChoiceButton } from "./choice-button";

export interface ProfileValue {
  readonly displayName: string;
  readonly buddy: BuddyShape;
  readonly tint: PaletteTint;
}

export interface ProfileStepProps {
  value: ProfileValue;
  onChange: (value: ProfileValue) => void;
  onNext: () => void;
  pending: boolean;
  error?: string;
}

export function ProfileStep({ value, onChange, onNext, pending, error }: ProfileStepProps) {
  const [squish, setSquish] = useState(0);
  const copy = welcomeCopy.profile;
  const first = firstNameOf(value.displayName) || "there";
  const pick = (next: Partial<ProfileValue>) => {
    onChange({ ...value, ...next });
    setSquish((n) => n + 1);
  };

  return (
    <div className="grid animate-rise gap-6">
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading text-balance">{copy.title(first)}</h1>
        <p className="m-0 text-text-2">{copy.subtitle}</p>
      </div>

      <div className="grid justify-items-center gap-3.5 pt-2 pb-1">
        <button
          key={squish}
          type="button"
          aria-label={copy.avatar}
          onClick={() => setSquish((n) => n + 1)}
          className={cn("cursor-pointer rounded-full", squish > 0 && "animate-squish")}
        >
          <Avatar name={value.displayName || first} tint={value.tint} buddy={value.buddy} size="3xl" className="size-28" />
        </button>
        <span data-tint={value.tint} className="inline-flex h-7 items-center rounded-sm bg-tint-bg px-3 text-footnote font-semibold text-tint">
          {buddyShapes[value.buddy].name}
        </span>
      </div>

      <TextField
        label={copy.name.label}
        name="displayName"
        autoComplete="nickname"
        maxLength={24}
        placeholder={copy.name.placeholder}
        value={value.displayName}
        onChange={(e) => onChange({ ...value, displayName: e.target.value })}
        feedback={error ? { tone: "error", message: error } : undefined}
      />

      <div className="grid gap-2.5">
        <span className="text-small font-medium">{copy.buddy}</span>
        <div role="radiogroup" aria-label={copy.buddy} className="grid grid-cols-4 gap-2">
          {BUDDY_SHAPES.map((shape) => (
            <ChoiceButton
              key={shape}
              selected={value.buddy === shape}
              aria-label={buddyShapes[shape].name}
              onClick={() => pick({ buddy: shape })}
              className="gap-1.5 px-1 pt-2.5 pb-2"
            >
              <Avatar
                name={value.displayName || first}
                tint={value.tint}
                buddy={shape}
                size="2xl"
                className={cn("size-13 transition-transform duration-300 ease-spring", value.buddy === shape && "scale-106")}
              />
              <span className={cn("text-caption", value.buddy === shape ? "text-text" : "font-medium text-text-2")}>
                {buddyShapes[shape].name}
              </span>
            </ChoiceButton>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5">
        <span className="text-small font-medium">{copy.colour}</span>
        <div role="radiogroup" aria-label={copy.colour} className="grid grid-cols-9 gap-1.5">
          {PALETTE_TINTS.map((tint) => (
            <button
              key={tint}
              type="button"
              role="radio"
              aria-checked={value.tint === tint}
              aria-label={tint}
              data-tint={tint}
              onClick={() => pick({ tint })}
              className={cn(
                "grid aspect-square cursor-pointer place-items-center rounded-full bg-tint-bg transition-[box-shadow,transform] duration-300 ease-spring hover:-translate-y-0.5 active:scale-90",
                value.tint === tint && "scale-108 ring-2 ring-tint ring-offset-2 ring-offset-bg",
              )}
            >
              <span className="grid size-[44%] place-items-center rounded-full bg-tint">
                {value.tint === tint && <Icon name="check" size={10} strokeWidth={4} className="text-white" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" fullWidth loading={pending} onClick={onNext} className="gap-2">
        {copy.next}
        <Icon name="arrow-right" size={16} strokeWidth={2.2} />
      </Button>
    </div>
  );
}
