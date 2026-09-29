import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { Buddy } from "./buddy";

export function initialsOf(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-tint-bg font-semibold text-tint select-none",
  {
    variants: {
      size: {
        sm: "size-6 text-[10px]",
        md: "size-8 text-caption",
        lg: "size-9 text-footnote",
        xl: "size-10 text-small font-semibold",
        "2xl": "size-14 text-body font-semibold",
        "3xl": "size-24 text-title",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;

export const avatarPixels = {
  sm: 24,
  md: 32,
  lg: 36,
  xl: 40,
  "2xl": 56,
  "3xl": 96,
} as const satisfies Record<AvatarSize, number>;

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof avatarVariants> {
  name: string;
  tint: Tint;
  initials?: string;
  buddy?: BuddyShape | null;
}

const COUNT_LABEL = /^\+\d+$/;

export function Avatar({ name, tint, initials, buddy, size, className, ...rest }: AvatarProps) {
  if (initials && COUNT_LABEL.test(initials)) {
    return (
      <span
        role="img"
        aria-label={name}
        data-tint={tint}
        className={cn(avatarVariants({ size }), className)}
        {...rest}
      >
        {initials}
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      title={initials ?? initialsOf(name)}
      data-tint={tint}
      className={cn(avatarVariants({ size }), className)}
      {...rest}
    >
      <Buddy seed={name} tint={tint} shape={buddy} size={avatarPixels[size ?? "md"]} className="size-full" />
    </span>
  );
}

export interface StackPerson {
  readonly id: string;
  readonly name: string;
  readonly tint: Tint;
  readonly initials?: string;
  readonly buddy?: BuddyShape | null;
  readonly online?: boolean;
  readonly anonymous?: boolean;
}
