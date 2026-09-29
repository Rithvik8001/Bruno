import { cva, type VariantProps } from "class-variance-authority";

export const iconButtonVariants = cva(
  [
    "inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-control",
    "transition-[background-color,color] duration-150 ease-standard",
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

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;
