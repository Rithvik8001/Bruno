"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./icon-button";

export interface MenuItem {
  readonly id: string;
  readonly icon: IconName;
  readonly label: string;
  readonly caption?: string;
  readonly onSelect: () => void;
}

export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
  icon?: IconName;
  className?: string;
}

export function Menu({ label, items, icon = "more", className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !wrap.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = rows.findIndex((row) => row === document.activeElement);
    const last = rows.length - 1;
    const next =
      event.key === "ArrowDown" ? (at >= last ? 0 : at + 1) : event.key === "ArrowUp" ? (at <= 0 ? last : at - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    rows[next]?.focus();
  };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <IconButton
        ref={trigger}
        icon={icon}
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn("text-text", open ? "bg-surface-2" : "bg-surface hover:bg-surface-2")}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            ref={list}
            role="menu"
            aria-label={label}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: T.t1, ease: EASE } }}
            transition={{ duration: T.t2, ease: EASE }}
            className="absolute top-[calc(100%+8px)] right-0 z-60 grid w-66 max-w-[calc(100vw-40px)] gap-0.5 rounded-card border border-line bg-bg p-1.5 shadow-float"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  buzz(HAPTICS.press);
                  setOpen(false);
                  item.onSelect();
                }}
                className="grid min-h-14 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-tile bg-transparent px-2.5 py-1.5 text-left text-text transition-[background-color] duration-150 ease-standard hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              >
                <span aria-hidden className="grid size-9 place-items-center rounded-[11px] bg-surface-2 text-text-2">
                  <Icon name={item.icon} size={18} strokeWidth={1.9} />
                </span>
                <span className="grid min-w-0">
                  <span className="font-medium">{item.label}</span>
                  {item.caption && <span className="text-footnote text-text-2">{item.caption}</span>}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
