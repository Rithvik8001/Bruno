import type { DOMKeyframesDefinition, Transition } from "motion/react";
import { SPRING_CURVE } from "./tokens";

export interface KeyframeAnimation {
  readonly keyframes: DOMKeyframesDefinition;
  readonly transition: Transition;
}

export const SHAKE: KeyframeAnimation = {
  keyframes: { x: [0, -8, 7, -4, 2, 0] },
  transition: { duration: 0.38, ease: "easeOut" },
};

export const SQUISH: KeyframeAnimation = {
  keyframes: { scaleX: [1, 1.16, 0.92, 1.04, 1], scaleY: [1, 0.86, 1.1, 0.97, 1] },
  transition: { duration: 0.52, ease: "easeOut" },
};

export const POP: KeyframeAnimation = {
  keyframes: { scale: [1, 1.08, 1] },
  transition: { duration: 0.38, ease: SPRING_CURVE },
};

export const WIGGLE: KeyframeAnimation = {
  keyframes: { rotate: [0, -10, 10, 0] },
  transition: { duration: 0.42, ease: "easeOut" },
};

export const BELL: KeyframeAnimation = {
  keyframes: { rotate: [0, -14, 12, -6, 0] },
  transition: { duration: 0.52, ease: "easeOut" },
};

export const HOP: KeyframeAnimation = {
  keyframes: { y: [0, -12, 0], scaleX: [1, 1.1, 0.92, 1], scaleY: [1, 1.1, 1.08, 1] },
  transition: { duration: 0.52, ease: "easeOut" },
};

export const BOB: KeyframeAnimation = {
  keyframes: { y: [0, -4, 0], rotate: [-4, 4, -4] },
  transition: { duration: 2.6, ease: "easeInOut", repeat: Infinity },
};

export const WAVE: KeyframeAnimation = {
  keyframes: { y: [0, -6, 0, -4, 0], rotate: [0, -8, 8, -4, 0] },
  transition: { duration: 1.6, ease: "easeInOut", repeat: 1 },
};
