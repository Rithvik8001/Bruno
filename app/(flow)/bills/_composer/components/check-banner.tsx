"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { pressMotion } from "@/components/motion/press";
import { CheckIn } from "@/components/motion/check-in";
import { Icon } from "@/components/icons/icon";
import { T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { checkTint, type CheckTone } from "../data";

export interface CheckBannerProps {
  tone: CheckTone;
  children: ReactNode;
  action?: { readonly label: string; readonly onAction: () => void };
}

const ICON_SIZE = 18;

export function CheckBanner({ tone, children, action }: CheckBannerProps) {
  const ok = tone === "ok";
  return (
    <div
      role="status"
      data-tint={checkTint[tone]}
      className={cn(
        "flex items-center gap-2.5 rounded-tile py-3 pl-3.5 text-small font-medium",
        "transition-[background-color,color] duration-220 ease-standard",
        tone === "neutral" ? "bg-surface text-text-2" : "bg-tint-bg text-tint",
        action ? "pr-2" : "pr-3.5",
      )}
    >
      <span className="grid size-4.5 shrink-0 place-items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {ok ? (
            <CheckIn key="ok" className="grid place-items-center" exit={{ opacity: 0, transition: { duration: T.t1 } }}>
              <Icon name="check" size={ICON_SIZE} strokeWidth={2.2} />
            </CheckIn>
          ) : (
            <motion.span
              key="alert"
              className="grid place-items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.t2 }}
            >
              <Icon name="alert" size={ICON_SIZE} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="flex-1">{children}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        {action && (
          <motion.button
            key="fix"
            type="button"
            onClick={action.onAction}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: T.t1 } }}
            {...pressMotion()}
            className="h-8 shrink-0 cursor-pointer rounded-sm bg-bg px-2.5 text-footnote font-semibold whitespace-nowrap text-text"
          >
            {action.label}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
