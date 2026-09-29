"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { DotBurst } from "@/components/motion/bursts";
import { CheckIn } from "@/components/motion/check-in";
import { hoverLift, pressMotion } from "@/components/motion/press";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { BUDDY_SHAPES, buddyShapes, type BuddyShape } from "@/lib/design-system/buddies";
import { PALETTE_TINTS, type PaletteTint } from "@/lib/design-system/tokens";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SQUISH } from "@/lib/motion/keyframes";
import { SPRING, T } from "@/lib/motion/tokens";
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
              <motion.span initial={false} animate={{ scale: value.buddy === shape ? 1.06 : 1 }} transition={SPRING} className="block">
                <Avatar name={value.displayName || first} tint={value.tint} buddy={shape} size="2xl" className="size-13" />
              </motion.span>
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
            <motion.button
              key={tint}
              type="button"
              role="radio"
              aria-checked={value.tint === tint}
              aria-label={tint}
              data-tint={tint}
              onClick={() => pick({ tint })}
              onTapStart={() => buzz(HAPTICS.select)}
              initial={false}
              animate={{ scale: value.tint === tint ? 1.08 : 1 }}
              whileHover={hoverLift.whileHover}
              whileTap={hoverLift.whileTap}
              transition={hoverLift.transition}
              className={cn(
                "grid aspect-square cursor-pointer place-items-center rounded-full bg-tint-bg transition-shadow duration-300 ease-spring",
                value.tint === tint && "ring-2 ring-tint ring-offset-2 ring-offset-bg",
              )}
            >
              <span className="grid size-[44%] place-items-center rounded-full bg-tint">
                {value.tint === tint && (
                  <CheckIn className="grid place-items-center">
                    <Icon name="check" size={10} strokeWidth={4} className="text-white" />
                  </CheckIn>
                )}
              </span>
            </motion.button>
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
