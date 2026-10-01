"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { isLatestMonth, monthCells, monthOf, monthTitle, pickerLabel, shiftDay, shiftMonth, type MonthView } from "@/lib/calendar";
import { dayWords } from "@/lib/dates";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { Field } from "./field";
import { IconButton } from "./icon-button";
import { Sheet } from "./sheet";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const POPOVER_QUERY = "(min-width: 640px)";

const copy = {
  previous: "Previous month",
  next: "Next month",
  close: "Close",
} as const;

interface CalendarProps {
  value: string;
  today: string;
  roomy: boolean;
  onPick: (iso: string) => void;
}

function Calendar({ value, today, roomy, onPick }: CalendarProps) {
  const [view, setView] = useState<MonthView>(() => monthOf(value));
  const latest = isLatestMonth(view, today);
  const words = { today: dayWords.today, yesterday: dayWords.yesterday };
  const nav = cn(
    "grid cursor-pointer place-items-center rounded-control bg-transparent text-text-2 transition-colors duration-150 ease-standard",
    "hover:bg-surface hover:text-text disabled:cursor-default disabled:text-border disabled:hover:bg-transparent",
    roomy ? "size-11" : "size-9",
  );
  const quick = [
    { label: dayWords.today, iso: today },
    { label: dayWords.yesterday, iso: shiftDay(today, -1) },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <span aria-live="polite" className="pl-1 font-semibold">
          {monthTitle(view)}
        </span>
        <div className="flex gap-1">
          <motion.button type="button" aria-label={copy.previous} onClick={() => setView((v) => shiftMonth(v, -1))} {...pressMotion()} className={nav}>
            <Icon name="chevron-left" size={18} />
          </motion.button>
          <motion.button
            type="button"
            aria-label={copy.next}
            disabled={latest}
            onClick={() => setView((v) => shiftMonth(v, 1))}
            {...(latest ? {} : pressMotion())}
            className={nav}
          >
            <Icon name="chevron-right" size={18} />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day, index) => (
          <span key={index} aria-hidden className="grid h-6 place-items-center text-caption text-muted">
            {day}
          </span>
        ))}
        {monthCells(view, today).map((cell) => {
          const selected = cell.iso === value;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!cell.inMonth || cell.future}
              aria-label={pickerLabel(cell.iso, today, words)}
              aria-pressed={selected}
              onClick={() => onPick(cell.iso)}
              className={cn(
                "grid min-w-0 cursor-pointer place-items-center rounded-control p-0 text-small",
                "transition-[background-color,transform] duration-150 ease-standard active:scale-[0.94] disabled:cursor-default",
                roomy ? "h-11" : "h-9.5",
                !cell.inMonth && "invisible",
                selected
                  ? "bg-brand font-semibold text-on-brand hover:bg-brand-hover"
                  : cell.future
                    ? "bg-transparent font-medium text-border"
                    : "bg-transparent font-medium text-text hover:bg-surface",
                cell.today && !selected && "font-semibold shadow-[inset_0_0_0_1.5px_var(--brand)]",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-line pt-3">
        {quick.map((option) => {
          const on = option.iso === value;
          return (
            <motion.button
              key={option.label}
              type="button"
              onClick={() => onPick(option.iso)}
              {...pressMotion()}
              className={cn(
                "cursor-pointer rounded-sm px-3 text-small font-semibold transition-colors duration-150 ease-standard",
                roomy ? "h-11" : "h-8",
                on ? "bg-brand-tint text-brand" : "bg-surface text-text hover:bg-surface-2",
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export interface DatePickerProps {
  label: string;
  value: string;
  today: string;
  onValueChange: (iso: string) => void;
  fieldClassName?: string;
  className?: string;
}

export function DatePicker({ label, value, today, onValueChange, fieldClassName, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const wide = useMediaQuery(POPOVER_QUERY);
  const wrap = useRef<HTMLDivElement>(null);
  const popover = open && wide;

  useEffect(() => {
    if (!popover) return undefined;
    const onDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !wrap.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [popover]);

  const shown = pickerLabel(value, today, { today: dayWords.today, yesterday: dayWords.yesterday });

  const pick = (iso: string) => {
    buzz(HAPTICS.select);
    setOpen(false);
    onValueChange(iso);
  };

  const sheetTitle: ReactNode = (
    <span className="flex items-center justify-between gap-3">
      {label}
      <IconButton icon="close" label={copy.close} onClick={() => setOpen(false)} className="-mr-2.5 size-11 text-text-2" />
    </span>
  );

  return (
    <Field label={label} className={fieldClassName}>
      {(control) => (
        <div ref={wrap} className="relative min-w-0">
          <button
            {...control}
            type="button"
            aria-label={`${label}: ${shown}`}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className={cn(
              "flex h-12 w-full min-w-0 cursor-pointer items-center gap-2 rounded-control border pr-3 pl-3.5 text-left text-body font-medium text-text outline-none",
              "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
              "focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-tint)]",
              open ? "border-brand bg-bg shadow-[0_0_0_3px_var(--brand-tint)]" : "border-transparent bg-surface hover:bg-surface-2",
              className,
            )}
          >
            <span suppressHydrationWarning className="min-w-0 flex-1 truncate">
              {shown}
            </span>
            <Icon name="calendar" size={18} className={cn("shrink-0 transition-colors duration-150 ease-standard", open ? "text-brand" : "text-muted")} />
          </button>

          <AnimatePresence>
            {popover && (
              <motion.div
                key="popover"
                role="dialog"
                aria-label={label}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, transition: { duration: T.t1, ease: EASE } }}
                transition={{ duration: T.t2, ease: EASE }}
                className="absolute top-[calc(100%+8px)] right-0 z-60 w-76 max-w-[calc(100vw-32px)] origin-top-right rounded-card border border-line bg-bg p-3.5 shadow-float"
              >
                <Calendar value={value} today={today} roomy={false} onPick={pick} />
              </motion.div>
            )}
          </AnimatePresence>

          <Sheet open={open && !wide} onOpenChange={setOpen} title={sheetTitle}>
            <Calendar key={value} value={value} today={today} roomy onPick={pick} />
          </Sheet>
        </div>
      )}
    </Field>
  );
}
