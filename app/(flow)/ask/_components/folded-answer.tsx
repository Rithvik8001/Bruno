"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { CardView, Tone } from "../_lib/view";

const toneTint = { in: "green", out: "red", plain: undefined, muted: undefined } as const satisfies Record<Tone, Tint | undefined>;

export function FoldedAnswer({ view, onOpen }: { view: CardView; onOpen: () => void }) {
  const { tone } = view.folded;
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={askCopy.thread.open}
      aria-expanded={false}
      {...pressMotion(true)}
      className="flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-tile bg-surface py-2 pr-1.5 pl-4 text-left text-text transition-colors duration-150 ease-standard hover:bg-surface-2"
    >
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-caption text-muted">{view.eyebrow.text}</span>
        <span data-tint={toneTint[tone]} className={cn("truncate font-semibold", tone === "muted" ? "text-text-2" : toneTint[tone] ? "text-tint" : "text-text")}>
          {view.folded.text}
        </span>
      </span>
      <span aria-hidden className="grid size-11 shrink-0 place-items-center text-text-2">
        <Icon name="chevron-down" size={18} strokeWidth={2} />
      </span>
    </motion.button>
  );
}
