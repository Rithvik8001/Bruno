"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { composerCopy } from "../data";

export interface YouSaidBannerProps {
  text: string;
  redraftHref: string;
}

export function YouSaidBanner({ text, redraftHref }: YouSaidBannerProps) {
  const copy = composerCopy.items.told;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="rounded-tile bg-surface py-0.5 pr-0.5 pl-3.5">
      <div className="flex min-h-12 items-center gap-2.5">
        <Icon name="quote" size={16} className="shrink-0 text-muted" />
        <span className="grid min-w-0 flex-1 py-1">
          <span className="text-caption font-semibold text-muted">{copy.label}</span>
          <span className={cn("text-small", open ? "wrap-anywhere" : "truncate")}>{text}</span>
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={copy.show}
          onClick={() => setOpen((value) => !value)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-control bg-transparent text-text-2 transition-colors duration-150 ease-standard hover:bg-surface-2"
        >
          <motion.span className="grid" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: T.t3, ease: EASE }}>
            <Icon name="chevron-down" size={18} strokeWidth={2} />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="actions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: T.t2, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 pr-3 pb-3 pl-6.5">
              <PressLink href={redraftHref} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "gap-2 text-small")}>
                <Icon name="pencil" size={16} strokeWidth={1.9} />
                {copy.redraft}
              </PressLink>
              <span className="text-footnote text-muted">{copy.redraftNote}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
