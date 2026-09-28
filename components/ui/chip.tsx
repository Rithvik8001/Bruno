import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { GroupArtId } from "@/lib/design-system/icons3d";
import {
  balanceTint,
  billStatuses,
  type BalanceDirection,
  type BillStatus,
} from "@/lib/design-system/semantics";
import type { Tint } from "@/lib/design-system/tokens";
import { cents, formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { Icon3d } from "./icon-3d";

export const chipVariants = cva(
  "inline-flex shrink-0 items-center whitespace-nowrap bg-tint-bg font-semibold text-tint",
  {
    variants: {
      size: {
        lg: "h-11 gap-2.5 rounded-tile pr-4 pl-3 text-body",
        md: "h-8 gap-1.5 rounded-control pr-3 pl-2.25 text-small",
        sm: "h-7 gap-1.5 rounded-sm pr-2.5 pl-2 text-footnote font-semibold",
        xs: "h-5 gap-1 rounded-xs px-1.75 text-[11px] leading-none",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const iconSize = { lg: 20, md: 16, sm: 14, xs: 12 } as const;

export interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  tint: Tint;
  icon?: IconName;
  art?: GroupArtId;
  dot?: boolean;
  children: ReactNode;
}

export function Chip({ tint, icon, art, dot, size, className, children, ...rest }: ChipProps) {
  const s = size ?? "md";
  return (
    <span data-tint={tint} className={cn(chipVariants({ size: s }), className)} {...rest}>
      {art ? (
        <Icon3d icon={art} size={iconSize[s] + 2} />
      ) : (
        icon && <Icon name={icon} size={iconSize[s]} strokeWidth={s === "lg" ? 1.8 : 2.2} />
      )}
      {dot && !art && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export interface StatusChipProps extends Omit<ChipProps, "tint" | "icon" | "children"> {
  status: BillStatus;
  children?: ReactNode;
}

export function StatusChip({ status, children, ...rest }: StatusChipProps) {
  const s = billStatuses[status];
  return (
    <Chip tint={s.tint} icon={s.icon} {...rest}>
      {children ?? s.label}
    </Chip>
  );
}

export type TagProps = Omit<ChipProps, "dot" | "size">;

export function Tag({ tint, ...rest }: TagProps) {
  return <Chip tint={tint} size="sm" dot={tint !== "neutral" && tint !== "muted"} {...rest} />;
}

export interface AmountChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  amount: Cents;
  direction?: BalanceDirection;
  settledLabel?: string;
}

export function AmountChip({ amount, direction, settledLabel, className, ...rest }: AmountChipProps) {
  const dir: BalanceDirection =
    direction ?? (amount > 0 ? "owed" : amount < 0 ? "owes" : "settled");
  const signed =
    dir === "owes" ? cents(-Math.abs(amount)) : dir === "owed" ? cents(Math.abs(amount)) : amount;
  return (
    <span
      data-tint={balanceTint[dir]}
      className={cn(
        "inline-flex h-7.5 shrink-0 items-center rounded-sm bg-tint-bg px-2.5 text-small font-semibold text-tint",
        className,
      )}
      {...rest}
    >
      {dir === "settled" && settledLabel ? settledLabel : formatCents(signed, dir === "settled" ? "never" : "always")}
    </span>
  );
}
