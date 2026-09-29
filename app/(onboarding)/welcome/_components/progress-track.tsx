"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { HOP } from "@/lib/motion/keyframes";
import { SOFT_SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { ONBOARDING_STEPS, welcomeCopy } from "../_data";

const STOP_GAP = 46;
const STOPS = ONBOARDING_STEPS.map((_, i) => i * STOP_GAP);
const LAST = STOPS.length - 1;

export interface ProgressTrackProps {
  position: number;
  name: string;
  tint: PaletteTint;
  buddy: BuddyShape;
}

export function ProgressTrack({ position, name, tint, buddy }: ProgressTrackProps) {
  const total = ONBOARDING_STEPS.length - 1;
  const at = Math.min(Math.max(position, 0), LAST);
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduce = useReducedMotion();
  const previous = useRef(at);

  useEffect(() => {
    if (previous.current === at) return;
    previous.current = at;
    if (reduce || !scope.current) return;
    void animate(scope.current, HOP.keyframes, HOP.transition);
  }, [animate, at, reduce, scope]);

  return (
    <div role="img" aria-label={welcomeCopy.progress(at + 1, total)} data-tint={tint} className="relative h-7 w-28">
      <span className="absolute inset-x-2.5 top-1/2 border-t-2 border-dotted border-border" />
      <motion.span
        className="absolute top-1/2 left-2.5 -mt-px h-0.5 w-23 origin-left rounded-full bg-tint"
        initial={false}
        animate={{ scaleX: at / LAST }}
        transition={SOFT_SPRING}
      />
      {STOPS.map((x, i) => (
        <span
          key={x}
          style={{ left: 10 + x }}
          className={cn("absolute top-1/2 -mt-1 -ml-1 size-2 rounded-full transition-colors", i <= at ? "bg-tint" : "bg-border")}
        />
      ))}
      <motion.span
        className="absolute top-1/2 left-2.5 -mt-3 -ml-3"
        initial={false}
        animate={{ x: STOPS[at] }}
        transition={SOFT_SPRING}
      >
        <span ref={scope} className="block origin-bottom rounded-full ring-2 ring-bg">
          <Avatar name={name || welcomeCopy.you} tint={tint} buddy={buddy} size="sm" />
        </span>
      </motion.span>
    </div>
  );
}
