"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { pressMotion } from "@/components/motion/press";
import { EASE, T } from "@/lib/motion/tokens";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface FlaggedLineProps {
  name: string;
  guesses: readonly Cents[];
  value: Cents | null;
  onResolve: (value: Cents) => void;
  prompt?: string;
}

const FADE = { duration: T.t3, ease: EASE } as const;

export function FlaggedLine({
  name,
  guesses,
  value,
  onResolve,
  prompt = "Hard to read — was it",
}: FlaggedLineProps) {
  const open = value === null;

  return (
    <motion.div
      data-tint="amber"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={FADE}
      className={cn(
        "-mx-2.5 my-1.5 grid rounded-[12px] p-2.5 transition-[background-color] duration-220 ease-standard",
        open ? "bg-tint-bg" : "bg-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{name}</span>
        <span
          data-tint={open ? "amber" : "green"}
          className={cn(
            "inline-flex h-9 min-w-18 items-center justify-end gap-1.5 rounded-sm border px-2.5 font-semibold transition-[background-color,border-color,color] duration-220 ease-standard",
            open ? "border-tint bg-bg text-text" : "border-transparent bg-tint-bg text-tint",
          )}
        >
          {value !== null && (
            <CheckIn key={value} className="inline-flex">
              <Icon name="check" size={14} strokeWidth={2.4} />
            </CheckIn>
          )}
          {value === null ? "—" : formatCents(value)}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="guesses"
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={FADE}
          >
            <div
              role="group"
              aria-label={`${prompt}…`}
              className="flex flex-wrap items-center gap-2 pt-2 text-footnote font-semibold text-tint"
            >
              <Icon name="alert" size={14} strokeWidth={2.2} />
              {prompt}
              {guesses.map((g) => (
                <motion.button
                  key={g}
                  type="button"
                  onClick={() => onResolve(g)}
                  {...pressMotion()}
                  className="h-7 cursor-pointer rounded-[7px] bg-bg px-2.5 text-footnote font-semibold text-text shadow-float"
                >
                  {formatCents(g)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
