"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { radii } from "@/lib/design-system/tokens";
import { BOB } from "@/lib/motion/keyframes";
import { SPRING, SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { RESET_STAGES, resetCopy, resetStageAppearance } from "../_data";

export interface ResetJourneyProps {
  position: number;
}

const DOT_STAGGER = 0.06;
const CURRENT_RADIUS = 20;
const LAYOUT_TRANSITION = { layout: SPRING } as const;
const TILE_TRANSITION = { layout: SPRING, borderRadius: SPRING } as const;

const SPARKLES = [
  { size: 10, delay: 0, className: "-top-1.5 -right-1.5" },
  { size: 7, delay: 0.9, className: "-bottom-0.5 -left-2" },
] as const;

function Connector({ reached }: { reached: boolean }) {
  return (
    <motion.span layout transition={LAYOUT_TRANSITION} aria-hidden className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ scale: reached ? [1, 1.6, 1] : 1 }}
          transition={{ duration: T.pop, ease: SPRING_CURVE, delay: i * DOT_STAGGER }}
          style={{ transitionDelay: `${i * DOT_STAGGER}s` }}
          className={cn("size-1 rounded-full transition-colors duration-300", reached ? "bg-green" : "bg-border")}
        />
      ))}
    </motion.span>
  );
}

function Sparkles() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return SPARKLES.map((s) => (
    <motion.span
      key={s.delay}
      aria-hidden
      className={cn("absolute grid place-items-center", s.className)}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.7, 1.15, 0.7] }}
      transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, delay: s.delay }}
    >
      <Icon name="sparkle" size={s.size} />
    </motion.span>
  ));
}

export function ResetJourney({ position }: ResetJourneyProps) {
  const reduce = useReducedMotion();
  const total = RESET_STAGES.length;
  const label = position < total ? resetCopy.journey.step(position + 1, total) : resetCopy.journey.finished;

  return (
    <div role="img" aria-label={label} className="flex h-18 items-center gap-1.5">
      {RESET_STAGES.map((stage, i) => {
        const done = i < position;
        const current = i === position;
        const { icon, tint } = resetStageAppearance[stage];
        return (
          <motion.div layout transition={LAYOUT_TRANSITION} key={stage} className="flex items-center gap-1.5">
            {i > 0 && <Connector reached={i <= position} />}
            <motion.span
              layout
              initial={false}
              animate={{ borderRadius: current ? CURRENT_RADIUS : radii.tile }}
              transition={TILE_TRANSITION}
              data-tint={done ? "green" : current ? tint : undefined}
              className={cn(
                "relative grid place-items-center transition-colors duration-300",
                current ? "size-16" : "size-9",
                done || current ? "bg-tint-bg text-tint" : "bg-surface text-muted",
              )}
            >
              <motion.span layout="position" transition={LAYOUT_TRANSITION} className="grid place-items-center">
                <motion.span
                  className="grid place-items-center"
                  initial={false}
                  animate={current && !reduce ? BOB.keyframes : { y: 0, rotate: 0 }}
                  transition={current && !reduce ? BOB.transition : SPRING}
                >
                  {done ? (
                    <CheckIn key="done" className="grid place-items-center">
                      <Icon name="check" size={16} strokeWidth={2.6} />
                    </CheckIn>
                  ) : (
                    <Icon name={icon} size={current ? 28 : 16} />
                  )}
                </motion.span>
              </motion.span>
              {current && <Sparkles />}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
