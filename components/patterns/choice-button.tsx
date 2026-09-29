"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { hoverLift } from "@/components/motion/press";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";

export interface ChoiceButtonProps extends Omit<HTMLMotionProps<"button">, "type" | "role"> {
  selected: boolean;
}

export function ChoiceButton({ selected, className, onTapStart, ...rest }: ChoiceButtonProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      {...hoverLift}
      onTapStart={(event, info) => {
        buzz(HAPTICS.select);
        onTapStart?.(event, info);
      }}
      className={cn(
        "grid cursor-pointer justify-items-center rounded-tile border-[1.5px] transition-[background-color,border-color] duration-200 ease-standard hover:bg-surface-2",
        selected ? "border-brand bg-bg" : "border-transparent bg-surface",
        className,
      )}
      {...rest}
    />
  );
}
