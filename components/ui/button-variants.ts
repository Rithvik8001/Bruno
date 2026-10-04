import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2",
    "whitespace-nowrap rounded-btn font-medium no-underline",
    "transition-[background-color,background-image,color] duration-150 ease-standard",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    "disabled:cursor-not-allowed disabled:bg-surface disabled:bg-none disabled:font-medium disabled:text-muted disabled:shadow-none aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        primary: "bg-brand skin-key-primary font-semibold text-on-brand shadow-key-primary hover:text-on-brand",
        secondary: "bg-surface skin-key font-semibold text-text shadow-key hover:text-text",
        tertiary: "bg-transparent text-text-2 hover:bg-surface hover:text-text",
        danger: "bg-red-bg font-semibold text-red hover:text-red",
        elevated: "bg-bg font-semibold text-text shadow-float hover:text-text",
        link: "h-auto bg-transparent px-0 font-semibold text-brand hover:bg-brand-tint",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-small pointer-coarse:h-9",
        md: "h-11 px-4 text-body",
        lg: "h-12 px-5.5 text-body",
      },
      fullWidth: { true: "w-full" },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-1.5 py-0.5" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
