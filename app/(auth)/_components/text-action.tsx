"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { pressMotion } from "@/components/motion/press";

export type TextActionProps = Omit<HTMLMotionProps<"button">, "type">;

export function TextAction({ disabled, ...rest }: TextActionProps) {
  return <motion.button type="button" disabled={disabled} {...(disabled ? {} : pressMotion())} {...rest} />;
}
