"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export interface SheetContentProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  tint?: Tint;
  actions?: ReactNode;
  titleId?: string;
  descriptionId?: string;
}

export function SheetContent({
  title,
  description,
  icon,
  tint = "green",
  actions,
  titleId,
  descriptionId,
}: SheetContentProps) {
  return (
    <>
      <div aria-hidden className="mx-auto mb-5 h-1 w-9 rounded-full bg-border sm:hidden" />
      {icon && (
        <span
          data-tint={tint}
          className="mb-3.5 grid size-10 place-items-center rounded-[12px] bg-tint-bg text-tint"
        >
          <Icon name={icon} size={22} />
        </span>
      )}
      <h2 id={titleId} className="m-0 text-title">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-1.5 mb-5 text-small text-text-2">
          {description}
        </p>
      )}
      {actions && <div className="grid gap-1">{actions}</div>}
    </>
  );
}

export const sheetPanelClassName = "w-full max-w-90 rounded-t-card bg-bg shadow-float sm:rounded-card";
export const sheetBodyClassName = "px-5 pt-3 pb-5 sm:pt-5";

export interface SheetProps extends Omit<SheetContentProps, "titleId" | "descriptionId"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function Sheet({ open, onOpenChange, className, ...content }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={content.description ? descriptionId : undefined}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      className={cn(
        sheetPanelClassName,
        "m-0 mx-auto mt-auto max-h-[85dvh] overflow-auto border-0 p-0 text-text sm:my-auto",
        "backdrop:bg-text/30 backdrop:backdrop-blur-[2px]",
        "translate-y-0 transition-[translate,opacity] duration-300 ease-standard starting:translate-y-8 starting:opacity-0",
        className,
      )}
    >
      <div className={sheetBodyClassName}>
        <SheetContent {...content} titleId={titleId} descriptionId={descriptionId} />
      </div>
    </dialog>
  );
}
