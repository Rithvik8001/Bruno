"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EASE, T } from "@/lib/motion/tokens";
import { askCopy } from "../_data";

const GHOSTS = ["w-[62%]", "w-[48%]", "w-[56%]"] as const;
const PULSE = { duration: 0.9, ease: EASE, repeat: Infinity, repeatType: "reverse" } as const;

export function ThinkingCard({ caption, onCancel }: { caption: string; onCancel: () => void }) {
  return (
    <div className="grid gap-3">
      <Rise className="grid gap-4.5 rounded-card bg-surface p-5">
        <div aria-live="polite" className="flex min-h-6 items-center gap-2.5">
          <motion.span aria-hidden className="shrink-0 text-brand" initial={{ opacity: 0.55 }} animate={{ opacity: 1 }} transition={PULSE}>
            <Icon name="sparkle" size={16} />
          </motion.span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={caption}
              className="min-w-0 font-semibold"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3, transition: { duration: T.t1 } }}
              transition={{ duration: T.t3, ease: EASE }}
            >
              {caption}
            </motion.span>
          </AnimatePresence>
        </div>
        <div aria-hidden className="grid gap-2">
          <Skeleton className="h-3 w-[34%] rounded-xs bg-surface-2" />
          <Skeleton className="h-10 w-[56%] rounded-control bg-surface-2" />
        </div>
        <div aria-hidden className="grid">
          {GHOSTS.map((width) => (
            <div key={width} className="grid min-h-14 grid-cols-[36px_minmax(0,1fr)_64px] items-center gap-3 border-t border-line">
              <Skeleton className="size-9 rounded-full bg-surface-2" />
              <Skeleton className={`h-3 rounded-xs bg-surface-2 ${width}`} />
              <Skeleton className="h-3 rounded-xs bg-surface-2" />
            </div>
          ))}
        </div>
      </Rise>
      <Button variant="tertiary" size="md" onClick={onCancel} className="h-11 justify-self-center">
        {askCopy.thinking.cancel}
      </Button>
    </div>
  );
}
