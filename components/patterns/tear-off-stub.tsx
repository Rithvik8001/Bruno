"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { fireConfetti } from "@/lib/motion/confetti";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export interface TearOffStubProps {
  children: ReactNode;
  tearOff: ReactNode;
  done?: ReactNode;
  torn: boolean;
  celebrate?: boolean;
  className?: string;
}

const RIP = { rotate: -6, x: 18, y: 56, opacity: 0 };
const REST = { rotate: 0, x: 0, y: 0, opacity: 1 };

export function TearOffStub({ children, tearOff, done, torn, celebrate = false, className }: TearOffStubProps) {
  const doneRef = useRef<HTMLDivElement>(null);
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <div className="grid gap-4 rounded-t-card bg-surface px-5 pt-5 pb-4 [&>*]:min-w-0">{children}</div>
      <div aria-hidden className="mx-3 border-t-2 border-dashed border-border" />
      <div className="grid">
        <motion.div
          inert={torn}
          initial={false}
          animate={torn ? RIP : REST}
          transition={{ duration: 0.52, ease: EASE, opacity: { duration: 0.42, ease: EASE, delay: torn ? 0.12 : 0 } }}
          style={{ originX: 0, originY: 0 }}
          className={cn(
            "[grid-area:1/1] grid gap-2.5 rounded-b-card px-5 pt-4 pb-5 transition-[background-color,box-shadow] duration-220",
            torn ? "bg-bg shadow-float" : "bg-surface",
          )}
        >
          {tearOff}
        </motion.div>
        <AnimatePresence>
          {torn && done && (
            <motion.div
              ref={doneRef}
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.t3, ease: EASE, delay: 0.36 }}
              onAnimationComplete={(definition) => {
                if (celebrate && definition !== "exit" && doneRef.current) fireConfetti(doneRef.current);
              }}
              className="[grid-area:1/1] grid gap-4 rounded-b-card bg-surface px-5 pt-4 pb-5"
            >
              {done}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
