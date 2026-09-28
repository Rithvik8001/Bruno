import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";

export const iconButtonVariants = cva(
  [
    "inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-control",
    "transition-[transform,background-color,color] duration-150 ease-standard active:scale-95",
    "disabled:cursor-not-allowed disabled:text-muted",
  ],
  {
    variants: {
      variant: {
        ghost: "bg-transparent text-text-2 hover:bg-surface hover:text-text",
        tinted: "bg-brand-tint text-brand",
      },
    },
    defaultVariants: { variant: "ghost" },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  icon: IconName;
  label: string;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  icon,
  label,
  variant,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant }), className)}
      {...rest}
    >
      <Icon name={icon} strokeWidth={variant === "tinted" ? 2 : undefined} />
    </button>
  );
}
