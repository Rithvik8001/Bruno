"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Allowance } from "@/lib/ai/rules";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { DoneView } from "../_lib/action-view";

export interface ActionDoneProps {
  view: DoneView;
  quota: Allowance;
  canUndo: boolean;
  undoing: boolean;
  foldable: boolean;
  onUndo: () => void;
  onFold: () => void;
}

export function ActionDone({ view, quota, canUndo, undoing, foldable, onUndo, onFold }: ActionDoneProps) {
  const copy = askCopy.act;
  return (
    <Rise role="status" className="grid gap-3.5 rounded-card bg-surface px-5 py-4">
      <div className="flex items-start gap-3">
        <motion.span
          aria-hidden
          data-tint={view.declined ? undefined : "green"}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: T.pop, ease: SPRING_CURVE, delay: 0.08 }}
          className={cn("grid size-9 shrink-0 place-items-center rounded-full", view.declined ? "bg-surface-2 text-text-2" : "bg-tint-bg text-tint")}
        >
          <Icon name={view.declined ? "close" : "check"} size={18} strokeWidth={2.4} />
        </motion.span>
        <div className="grid min-w-0 flex-1 gap-0.5 pt-1.5">
          <span className="font-semibold text-pretty">{view.line}</span>
          <span className="text-small text-pretty text-text-2">{view.sub}</span>
        </div>
        {foldable && (
          <motion.button
            type="button"
            onClick={onFold}
            aria-label={copy.fold}
            aria-expanded
            {...pressMotion()}
            className="-mt-1 -mr-3 grid size-11 shrink-0 cursor-pointer place-items-center rounded-control bg-transparent text-text-2 hover:bg-surface-2"
          >
            <Icon name="chevron-up" size={18} strokeWidth={2} />
          </motion.button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 pl-12">
        <PressLink href={view.link.href} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 max-w-full gap-2 px-3.5 text-small font-semibold")}>
          <span className="truncate">{view.link.label}</span>
          <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
        </PressLink>
        {canUndo && (
          <Button variant="tertiary" size="md" loading={undoing} onClick={onUndo} className="h-11 gap-1.5 pr-3.5 pl-2.5 text-small font-semibold hover:bg-surface-2">
            <Icon name="undo" size={16} strokeWidth={2} />
            {copy.undo}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line pt-3 text-footnote text-muted">
        <Icon name="sparkle" size={14} className="shrink-0" />
        <span>{copy.foot.used(quota.left, quota.limit, canUndo)}</span>
      </div>
    </Rise>
  );
}

export interface ActionLineProps {
  head: string;
  body: string;
  free: boolean;
}

export function ActionLine({ head, body, free }: ActionLineProps) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, scaleY: 0.6 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: T.t2 }}
      className="flex min-h-13 origin-top flex-wrap items-center gap-2.5 rounded-tile bg-surface px-4 py-2.5 text-small text-text-2"
    >
      <Icon name="close" size={16} strokeWidth={2} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-[1_1_160px]">
        <span className="font-semibold text-text">{head}</span> {body}
      </span>
      {free && <span className="text-caption whitespace-nowrap text-muted">{askCopy.act.line.free}</span>}
    </motion.div>
  );
}
