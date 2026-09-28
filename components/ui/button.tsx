import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2",
    "whitespace-nowrap rounded-control font-medium no-underline",
    "transition-[transform,background-color,color] duration-150 ease-standard",
    "active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:active:scale-100",
  ],
  {
    variants: {
      variant: {
        primary: "bg-brand font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand",
        secondary: "bg-surface text-text hover:bg-surface-2 hover:text-text",
        tertiary: "bg-transparent text-text-2 hover:bg-surface hover:text-text",
        danger: "bg-red-bg font-semibold text-red hover:text-red",
        elevated: "bg-bg font-semibold text-text shadow-float hover:text-text",
        link: "h-auto bg-transparent px-0 font-semibold text-brand hover:bg-brand-tint",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-small",
        md: "h-10 px-4 text-body",
        lg: "h-12 min-w-35 px-5.5 text-body",
      },
      fullWidth: { true: "w-full" },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-1.5 py-0.5" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  loading?: boolean;
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
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...rest}
      onClick={loading ? undefined : rest.onClick}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}
