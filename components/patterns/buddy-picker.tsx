"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { hoverLift } from "@/components/motion/press";
import { Avatar } from "@/components/ui/avatar";
import { BUDDY_SHAPES, buddyShapes, type BuddyShape } from "@/lib/design-system/buddies";
import { PALETTE_TINTS, type PaletteTint } from "@/lib/design-system/tokens";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { ChoiceButton } from "./choice-button";

export interface BuddyPick {
  readonly buddy?: BuddyShape;
  readonly tint?: PaletteTint;
}

export interface BuddyPickerProps {
  name: string;
  buddy: BuddyShape;
  tint: PaletteTint;
  onPick: (pick: BuddyPick) => void;
  labels: { readonly buddy: string; readonly colour: string };
  compact?: boolean;
  className?: string;
}

export function BuddyPicker({ name, buddy, tint, onPick, labels, compact = false, className }: BuddyPickerProps) {
  return (
    <div className={cn("grid gap-6", compact && "gap-4", className)}>
      <div className="grid gap-2.5">
        <span className={cn("font-medium", compact ? "text-footnote text-text-2" : "text-small")}>{labels.buddy}</span>
        <div
          role="radiogroup"
          aria-label={labels.buddy}
          className={cn("grid gap-2", compact ? "grid-cols-4 gap-1.5 sm:grid-cols-8" : "grid-cols-4")}
        >
          {BUDDY_SHAPES.map((shape) => (
            <ChoiceButton
              key={shape}
              selected={buddy === shape}
              aria-label={buddyShapes[shape].name}
              onClick={() => onPick({ buddy: shape })}
              className={cn("gap-1.5 px-1 pt-2.5 pb-2", compact && "gap-1 pt-1.5 pb-1.5")}
            >
              <motion.span initial={false} animate={{ scale: buddy === shape ? 1.06 : 1 }} transition={SPRING} className="block">
                <Avatar name={name} tint={tint} buddy={shape} size="2xl" className={compact ? "size-9" : "size-13"} />
              </motion.span>
              <span className={cn("text-caption", buddy === shape ? "text-text" : "font-medium text-text-2")}>
                {buddyShapes[shape].name}
              </span>
            </ChoiceButton>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5">
        <span className={cn("font-medium", compact ? "text-footnote text-text-2" : "text-small")}>{labels.colour}</span>
        <div role="radiogroup" aria-label={labels.colour} className={cn("grid grid-cols-9 gap-1.5", compact && "max-w-80")}>
          {PALETTE_TINTS.map((option) => (
            <motion.button
              key={option}
              type="button"
              role="radio"
              aria-checked={tint === option}
              aria-label={option}
              data-tint={option}
              onClick={() => onPick({ tint: option })}
              onTapStart={() => buzz(HAPTICS.select)}
              initial={false}
              animate={{ scale: tint === option ? 1.08 : 1 }}
              whileHover={hoverLift.whileHover}
              whileTap={hoverLift.whileTap}
              transition={hoverLift.transition}
              className={cn(
                "grid aspect-square cursor-pointer place-items-center rounded-full bg-tint-bg transition-shadow duration-300 ease-spring",
                tint === option && "ring-2 ring-tint ring-offset-2 ring-offset-bg",
              )}
            >
              <span className="grid size-[44%] place-items-center rounded-full bg-tint">
                {tint === option && (
                  <CheckIn className="grid place-items-center">
                    <Icon name="check" size={10} strokeWidth={4} className="text-white" />
                  </CheckIn>
                )}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
