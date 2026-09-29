"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { Ref } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { cn } from "@/lib/utils/cn";
import { iconButtonVariants, type IconButtonVariantProps } from "./icon-button-variants";

export { iconButtonVariants } from "./icon-button-variants";

export interface IconButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "aria-label">,
    IconButtonVariantProps {
  icon: IconName;
  label: string;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ icon, label, variant, className, type = "button", disabled, ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(iconButtonVariants({ variant }), className)}
      {...(disabled ? {} : pressMotion())}
      {...rest}
    >
      <Icon name={icon} strokeWidth={variant === "tinted" ? 2 : undefined} />
    </motion.button>
  );
}
