"use client";

import { AnimatePresence, motion } from "motion/react";
import { pressMotion } from "@/components/motion/press";
import { Avatar } from "@/components/ui/avatar";
import { CheckIndicator } from "@/components/ui/checkbox";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export interface ClaimFace {
  readonly id: string;
  readonly displayName: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
}

export interface ClaimRowProps {
  name: string;
  quantity: number;
  price: string;
  each: string | null;
  caption: string;
  claimed: boolean;
  mine: boolean;
  faces: readonly ClaimFace[];
  disabled?: boolean;
  onToggle: () => void;
}

const MAX_FACES = 3;

export function ClaimRow({ name, quantity, price, each, caption, claimed, mine, faces, disabled = false, onToggle }: ClaimRowProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={mine}
      disabled={disabled}
      onClick={() => {
        if (!mine) buzz(HAPTICS.select);
        onToggle();
      }}
      {...pressMotion(!disabled)}
      className={cn(
        "grid min-h-15 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line bg-transparent p-0 text-left",
        "focus-visible:rounded-xs focus-visible:-outline-offset-2 disabled:cursor-default",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <CheckIndicator checked={mine} />
        <span className="grid min-w-0">
          <span className="truncate font-medium">
            {name}
            {quantity > 1 && ` ×${quantity}`}
          </span>
          <span className={cn("min-h-4.5 truncate text-footnote", claimed ? "text-text-2" : "text-muted")}>{caption}</span>
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="flex">
          <AnimatePresence mode="popLayout" initial={false}>
            {faces.slice(0, MAX_FACES).map((person) => (
              <motion.span
                key={person.id}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.12, 1], opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0, transition: { duration: T.t1, ease: EASE } }}
                transition={{ duration: T.pop, ease: SPRING_CURVE, opacity: { duration: T.t1 } }}
                className="-ml-1.5 inline-flex rounded-full ring-2 ring-surface first:ml-0"
              >
                <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="sm" />
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
        <span className="grid justify-items-end">
          <span className={mine ? "font-semibold" : "font-medium"}>{price}</span>
          {each !== null && <span className="text-caption font-normal text-muted">{each}</span>}
        </span>
      </span>
    </motion.button>
  );
}
