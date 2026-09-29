import type { Transition } from "motion/react";

export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const SPRING_CURVE = [0.34, 1.56, 0.64, 1] as const;
export const SPRING = { type: "spring", stiffness: 520, damping: 24, mass: 0.8 } as const satisfies Transition;
export const SOFT_SPRING = { type: "spring", stiffness: 320, damping: 26 } as const satisfies Transition;
export const T = { t1: 0.15, t2: 0.22, t3: 0.3, pop: 0.42, roll: 0.9 } as const;
export const EASE_TRANSITION = { duration: T.t3, ease: EASE } as const satisfies Transition;
