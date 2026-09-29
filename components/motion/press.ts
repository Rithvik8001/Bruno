import type { HTMLMotionProps } from "motion/react";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, SPRING } from "@/lib/motion/tokens";

const PRESS_SCALE = 0.95;
const WIDE_PRESS_SCALE = 0.985;

export type PressMotion = Pick<HTMLMotionProps<"button">, "whileTap" | "transition" | "onTapStart">;

export function pressMotion(wide = false): PressMotion {
  return {
    whileTap: { scale: wide ? WIDE_PRESS_SCALE : PRESS_SCALE, transition: { duration: 0.11, ease: EASE } },
    transition: SPRING,
    onTapStart: () => buzz(HAPTICS.press),
  };
}

export const hoverLift = {
  whileHover: { y: -2, scale: 1.06 },
  whileTap: { scale: 0.92 },
  transition: SPRING,
} as const;

