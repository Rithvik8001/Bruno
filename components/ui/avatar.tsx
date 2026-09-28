import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export function initialsOf(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center rounded-full bg-tint-bg font-semibold text-tint select-none",
  {
    variants: {
      size: {
        sm: "size-6 text-[10px]",
        md: "size-8 text-caption",
        lg: "size-9 text-footnote",
        xl: "size-10 text-small font-semibold",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof avatarVariants> {
  name: string;
  tint: Tint;
  initials?: string;
}

export function Avatar({ name, tint, initials, size, className, ...rest }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      data-tint={tint}
      className={cn(avatarVariants({ size }), className)}
      {...rest}
    >
      {initials ?? initialsOf(name)}
    </span>
  );
}

export interface StackPerson {
  readonly id: string;
  readonly name: string;
  readonly tint: Tint;
  readonly initials?: string;
}

export interface AvatarStackProps {
  people: readonly StackPerson[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarStack({ people, max = 4, size = "md", className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const ring = "ring-2 ring-bg";
  const overlap = size === "sm" ? "-ml-2" : size === "md" ? "-ml-2.5" : "-ml-3";

  return (
    <ul className={cn("flex items-center pl-0", className)} aria-label={`${people.length} people`}>
      {shown.map((p, i) => (
        <li
          key={p.id}
          tabIndex={0}
          className={cn(
            "group relative list-none rounded-full outline-none",
            "transition-transform duration-200 ease-spring hover:z-10 hover:-translate-y-1 hover:scale-112",
            "focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:scale-112",
            i > 0 && overlap,
          )}
        >
          <Avatar name={p.name} tint={p.tint} initials={p.initials} size={size} className={ring} />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 flex h-6.5 -translate-x-1/2 translate-y-1 items-center",
              "rounded-sm bg-text px-2.25 text-caption whitespace-nowrap text-bg opacity-0 shadow-float",
              "transition-[opacity,transform] duration-150 ease-standard",
              "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            )}
          >
            {p.name}
          </span>
        </li>
      ))}
      {overflow > 0 && (
        <li className={cn("list-none", overlap)}>
          <span
            data-tint="neutral"
            className={cn(avatarVariants({ size }), ring)}
            aria-label={`and ${overflow} more`}
          >
            +{overflow}
          </span>
        </li>
      )}
    </ul>
  );
}
