"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { Icon3d } from "./icon-3d";
import { attachToastHost } from "./toast";

export type SheetSize = "auto" | "full";
export type SheetActionsPlacement = "tray" | "card";

export interface SheetContentProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName | { readonly moment: MomentIconId };
  tint?: Tint;
  actions?: ReactNode;
  children?: ReactNode;
  titleId?: string;
  descriptionId?: string;
}

const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 800;

export function SheetHeader({
  title,
  description,
  icon,
  tint = "green",
  titleId,
  descriptionId,
}: Omit<SheetContentProps, "actions" | "children">) {
  return (
    <>
      {icon && (
        <span
          data-tint={tint}
          className="mb-3.5 grid size-10 place-items-center rounded-[12px] bg-tint-bg text-tint"
        >
          {typeof icon === "string" ? (
            <Icon name={icon} size={22} />
          ) : (
            <Icon3d icon={icon.moment} size={28} />
          )}
        </span>
      )}
      <h2 id={titleId} className="m-0 text-title">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-1.5 mb-0 text-small text-text-2">
          {description}
        </p>
      )}
    </>
  );
}

export function SheetContent({
  actions,
  children,
  ...header
}: SheetContentProps) {
  return (
    <>
      <div className={cn(sheetCardClassName, "px-5.5 pt-3 pb-6 sm:pt-6")}>
        <div
          aria-hidden
          className="mx-auto mb-5 h-1 w-9 rounded-full bg-border sm:hidden"
        />
        <SheetHeader {...header} />
        {children && <div className="mt-5 grid gap-5">{children}</div>}
      </div>
      {actions && (
        <div className={cn(sheetActionsClassName, "pb-3")}>{actions}</div>
      )}
    </>
  );
}

export const sheetPanelClassName =
  "w-full rounded-t-[28px] border border-b-0 border-tray-rim bg-tray p-1.5 shadow-float sm:max-w-95 sm:rounded-[28px] sm:border-b";
export const sheetCardClassName =
  "rounded-[22px] border border-card-rim bg-bg shadow-[0_1px_2px_rgb(26_25_23/.05)]";
export const sheetActionsClassName =
  "flex flex-wrap items-center justify-end gap-2 px-1 pt-2.5";

export interface SheetProps extends Omit<
  SheetContentProps,
  "titleId" | "descriptionId"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: SheetSize;
  actionsIn?: SheetActionsPlacement;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  size = "auto",
  actionsIn = "tray",
  className,
  actions,
  children,
  ...header
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduce = useReducedMotion();
  const viewport = useVisualViewport();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return undefined;
    if (!d.open) {
      d.showModal();
      panel.current?.focus({ preventScroll: true });
    }
    return attachToastHost(d);
  }, [open]);

  const finishClose = () => {
    const d = ref.current;
    if (d?.open) d.close();
    setMounted(false);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY)
      onOpenChange(false);
  };

  const keyboardInset = viewport.keyboardOpen ? viewport.keyboardInset : 0;
  const maxHeight = viewport.keyboardOpen
    ? `calc(${viewport.height}px - 12px)`
    : "calc(100dvh - 24px)";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={header.description ? descriptionId : undefined}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-text",
        "backdrop:bg-text/30 backdrop:backdrop-blur-[2px]",
        !mounted && "hidden",
      )}
    >
      <div
        className="flex h-full w-full flex-col justify-end sm:items-center sm:justify-center sm:px-5"
        style={{ paddingBottom: keyboardInset }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <AnimatePresence onExitComplete={finishClose}>
          {open && (
            <motion.div
              key="panel"
              role="document"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: 48,
                      transition: { duration: T.t2, ease: EASE },
                    }
              }
              transition={{ duration: T.t3, ease: EASE }}
              drag={reduce ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragTransition={{ bounceStiffness: 320, bounceDamping: 26 }}
              onDragEnd={onDragEnd}
              style={{ maxHeight }}
              ref={panel}
              tabIndex={-1}
              className={cn(
                sheetPanelClassName,
                "flex min-h-0 flex-col text-text outline-none sm:max-h-[calc(100dvh-48px)]",
                size === "full" && "h-[calc(100dvh-24px)] sm:h-auto",
                className,
              )}
            >
              <div
                className={cn(
                  sheetCardClassName,
                  "flex min-h-0 flex-1 flex-col overflow-hidden",
                )}
              >
                <div className="shrink-0 pt-3 pb-1 sm:hidden">
                  <div
                    aria-hidden
                    className="mx-auto h-1 w-9 cursor-grab touch-none rounded-full bg-border"
                  />
                </div>
                <div
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5.5 pt-3 sm:pt-6",
                    actions && actionsIn === "card" ? "pb-4" : "pb-6",
                  )}
                >
                  <SheetHeader
                    {...header}
                    titleId={titleId}
                    descriptionId={descriptionId}
                  />
                  {children && (
                    <div className="mt-5 grid gap-5">{children}</div>
                  )}
                </div>
                {actions && actionsIn === "card" && (
                  <div className="grid shrink-0 gap-1 px-5.5 pb-5">
                    {actions}
                  </div>
                )}
              </div>
              {actions && actionsIn === "tray" ? (
                <div
                  className={cn(
                    sheetActionsClassName,
                    "shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3",
                  )}
                >
                  {actions}
                </div>
              ) : (
                <div aria-hidden className="shrink-0 pb-safe sm:hidden" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </dialog>
  );
}
