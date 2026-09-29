"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { Ref } from "react";
import { pressMotion } from "@/components/motion/press";
import { cn } from "@/lib/utils/cn";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";
import { Spinner } from "./spinner";

export { buttonVariants, type ButtonVariantProps } from "./button-variants";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children">, ButtonVariantProps {
  loading?: boolean;
  children?: React.ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...(disabled || loading ? {} : pressMotion(fullWidth === true))}
      {...rest}
      onClick={loading ? undefined : onClick}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </motion.button>
  );
}
