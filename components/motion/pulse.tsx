"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { EASE } from "@/lib/motion/tokens";

export function Pulse(props: Omit<HTMLMotionProps<"div">, "animate">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 1.6, ease: EASE, repeat: Infinity }}
      {...props}
    />
  );
}
