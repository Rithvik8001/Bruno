"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { DotBurst } from "@/components/motion/bursts";
import { BuddyPicker } from "@/components/patterns/buddy-picker";
import { pressMotion } from "@/components/motion/press";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { buddyShapes, type BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { SQUISH } from "@/lib/motion/keyframes";
import { SPRING, T } from "@/lib/motion/tokens";
import { firstNameOf } from "@/lib/people/defaults";
import { welcomeCopy } from "../_data";

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
  const [burst, setBurst] = useState(0);
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduce = useReducedMotion();
  const copy = welcomeCopy.profile;
  const first = firstNameOf(value.displayName) || "there";
  const squish = () => {
    if (reduce || !scope.current) return;
    void animate(scope.current, SQUISH.keyframes, SQUISH.transition);
  };
  const pick = (next: Partial<ProfileValue>) => {
    onChange({ ...value, ...next });
    setBurst((n) => n + 1);
    squish();
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading text-balance">{copy.title(first)}</h1>
        <p className="m-0 text-text-2">{copy.subtitle}</p>
      </div>

      <div className="grid justify-items-center gap-3.5 pt-2 pb-1">
        <span data-tint={value.tint} className="relative grid place-items-center">
          <motion.button type="button" aria-label={copy.avatar} onClick={squish} {...pressMotion()} className="cursor-pointer rounded-full">
            <span ref={scope} className="block origin-bottom">
              <Avatar name={value.displayName || first} tint={value.tint} buddy={value.buddy} size="3xl" className="size-28" />
            </span>
          </motion.button>
          {burst > 0 && <DotBurst key={burst} />}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value.buddy}
            data-tint={value.tint}
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: T.t1 } }}
            transition={SPRING}
            className="inline-flex h-7 items-center rounded-sm bg-tint-bg px-3 text-footnote font-semibold text-tint"
          >
            {buddyShapes[value.buddy].name}
          </motion.span>
        </AnimatePresence>
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

      <BuddyPicker
        name={value.displayName || first}
        buddy={value.buddy}
        tint={value.tint}
        onPick={pick}
        labels={{ buddy: copy.buddy, colour: copy.colour }}
      />

      <Button size="lg" fullWidth loading={pending} onClick={onNext} className="gap-2">
        {copy.next}
        <Icon name="arrow-right" size={16} strokeWidth={2.2} />
      </Button>
    </div>
  );
}
