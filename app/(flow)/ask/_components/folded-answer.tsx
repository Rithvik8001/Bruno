"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { CardView, Tone } from "../_lib/view";

const toneTint = { in: "green", out: "red", plain: undefined, muted: undefined } as const satisfies Record<Tone, Tint | undefined>;

export interface FoldedView {
  readonly eyebrow: string;
  readonly text: string;
  readonly tone: Tone;
  readonly ticked: boolean;
}

export const foldedAnswer = (view: CardView): FoldedView => ({ eyebrow: view.eyebrow.text, text: view.folded.text, tone: view.folded.tone, ticked: false });

export function FoldedAnswer({ view, onOpen }: { view: FoldedView; onOpen: () => void }) {
  const { tone } = view;
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={askCopy.thread.open}
      aria-expanded={false}
      {...pressMotion(true)}
      className="flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-tile bg-surface py-2 pr-1.5 pl-4 text-left text-text transition-colors duration-150 ease-standard hover:bg-surface-2"
    >
      {view.ticked && (
        <span aria-hidden data-tint="green" className="grid size-7 shrink-0 place-items-center rounded-full bg-tint-bg text-tint">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
      )}
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-caption text-muted">{view.eyebrow}</span>
        <span data-tint={toneTint[tone]} className={cn("truncate font-semibold", tone === "muted" ? "text-text-2" : toneTint[tone] ? "text-tint" : "text-text")}>
          {view.text}
        </span>
      </span>
      <span aria-hidden className="grid size-11 shrink-0 place-items-center text-text-2">
        <Icon name="chevron-down" size={18} strokeWidth={2} />
      </span>
    </motion.button>
  );
}
