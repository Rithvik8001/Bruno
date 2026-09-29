"use client";

import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { authCopy } from "../_data";

export type CodeStatusMode = "checking" | "sent" | "idle";

export interface CodeStatusProps {
  mode: CodeStatusMode;
  className?: string;
  children: ReactNode;
}

function content(mode: CodeStatusMode, idle: ReactNode): ReactNode {
  switch (mode) {
    case "checking":
      return (
        <span role="status" className="flex items-center gap-2 text-small font-medium text-brand">
          <Spinner className="size-3.5" label={authCopy.code.checking} />
          {authCopy.code.checking}
        </span>
      );
    case "sent":
      return (
        <Chip role="status" tint="green" size="sm" className="gap-1.5">
          <Icon name="check" size={14} strokeWidth={2.2} />
          {authCopy.code.resent}
        </Chip>
      );
    case "idle":
      return idle;
  }
}

export function CodeStatus({ mode, className, children }: CodeStatusProps) {
  return (
    <div className={cn("grid min-h-11 place-items-center text-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <Rise key={mode} className="grid justify-items-center gap-1">
          {content(mode, children)}
        </Rise>
      </AnimatePresence>
    </div>
  );
}
