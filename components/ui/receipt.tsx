import type { ReactNode } from "react";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { CheckIndicator } from "./checkbox";

export interface ReceiptProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Receipt({ children, className, bodyClassName }: ReceiptProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        aria-hidden
        className="h-2 bg-size-[12px_8px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 6px 0, var(--receipt-cut, var(--bg)) 4px, var(--surface) 4.5px)",
        }}
      />
      <div className={cn("rounded-b-card bg-surface px-5 pt-2 pb-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function ReceiptHeader({ title, trailing }: { title: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2 pb-3">
      <span className="font-semibold">{title}</span>
      {trailing}
    </div>
  );
}

export interface ReceiptLineProps {
  name: string;
  price: Cents;
  caption?: ReactNode;
  claimed: boolean;
  onClaimedChange: (claimed: boolean) => void;
}

export function ReceiptLine({ name, price, caption, claimed, onClaimedChange }: ReceiptLineProps) {
  return (
    <button
      type="button"
      aria-pressed={claimed}
      onClick={() => onClaimedChange(!claimed)}
      className={cn(
        "grid min-h-13 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-line bg-transparent p-0 text-left",
        "transition-[transform,opacity] duration-150 ease-standard active:scale-[0.985] active:opacity-70",
        "focus-visible:rounded-xs focus-visible:-outline-offset-2",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <CheckIndicator checked={claimed} />
        <span className="grid min-w-0">
          <span className="truncate font-medium">{name}</span>
          {caption && <span className="text-footnote text-text-2">{caption}</span>}
        </span>
      </span>
      <span
        className={cn(
          "transition-colors duration-150 ease-standard",
          claimed ? "font-semibold text-text" : "font-medium text-text-2",
        )}
      >
        {formatCents(price)}
      </span>
    </button>
  );
}

export function ReceiptRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-4 border-t border-line first:border-t-0",
        strong ? "font-semibold" : "[&>*:first-child]:font-medium [&>*:last-child]:font-semibold",
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ReceiptSummary({
  label,
  caption,
  value,
}: {
  label: ReactNode;
  caption?: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-4">
      <span className="grid">
        <span className="font-semibold">{label}</span>
        {caption && <span className="text-footnote text-text-2">{caption}</span>}
      </span>
      {value}
    </div>
  );
}
