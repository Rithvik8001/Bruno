"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { ActionNoteView } from "../_lib/action-view";

export function NoteCard({ view, onDismiss }: { view: ActionNoteView; onDismiss: () => void }) {
  const copy = askCopy;
  return (
    <Rise className="grid gap-4.5 rounded-card bg-surface p-5">
      <div className="flex min-h-7 items-center gap-2.5">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-brand-tint text-brand">
          <Icon name="sparkle" size={14} />
        </span>
        <span className="min-w-0 flex-1 text-footnote font-semibold text-text-2">{view.eyebrow}</span>
      </div>
      <div className="flex items-start gap-3.5">
        <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: T.pop, ease: SPRING_CURVE }}>
          <MomentTile icon={view.icon} tint={view.tint} size="lg" className="size-13 rounded-[16px]" />
        </motion.span>
        <div className="grid min-w-0 gap-1">
          <span className="text-title text-pretty">{view.title}</span>
          <span className="text-small text-pretty text-text-2">{view.body}</span>
        </div>
      </div>
      {view.quote && (
        <div className="flex items-center gap-2.5 rounded-tile bg-bg px-3.5 py-3">
          <Icon name="quote" size={16} strokeWidth={2} className="shrink-0 text-muted" />
          <span className="min-w-0 font-medium wrap-anywhere">“{view.quote}”</span>
        </div>
      )}
      {(view.primary || view.link || view.dismissable) && (
        <div className="flex flex-wrap gap-2">
          {view.primary && (
            <PressLink href={view.primary.href} className={cn(buttonVariants({ variant: "primary", size: "md" }), "h-11 max-w-full gap-2 px-4 text-small")}>
              <span className="truncate">{view.primary.label}</span>
              <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
            </PressLink>
          )}
          {view.link && (
            <PressLink href={view.link.href} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 max-w-full gap-2 px-3.5 text-small font-semibold")}>
              <span className="truncate">{view.link.label}</span>
              <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
            </PressLink>
          )}
          {view.dismissable && (
            <Button variant="tertiary" size="md" onClick={onDismiss} className="h-11 px-3.5 text-small hover:bg-surface-2">
              {copy.act.notNow}
            </Button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-line pt-3.5 text-footnote text-muted">
        <Icon name="sparkle" size={14} className="shrink-0" />
        <span>{copy.act.foot.free}</span>
      </div>
    </Rise>
  );
}
