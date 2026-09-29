"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { Pulse } from "@/components/motion/pulse";
import { EASE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  pulse?: boolean;
}

export function Skeleton({ className, style, pulse = true }: SkeletonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className={cn("block rounded-xs bg-surface-2", className)}
      style={style}
      animate={pulse && !reduce ? { opacity: [0.55, 1, 0.55] } : undefined}
      transition={{ duration: 1.6, ease: EASE, repeat: Infinity }}
    />
  );
}

export function ListRowSkeleton({
  titleWidth = "50%",
  captionWidth = "30%",
}: {
  titleWidth?: `${number}%`;
  captionWidth?: `${number}%`;
}) {
  return (
    <Pulse className="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
      <Skeleton pulse={false} className="size-10 rounded-full" />
      <span className="grid gap-2">
        <Skeleton pulse={false} className="h-3" style={{ width: titleWidth }} />
        <Skeleton pulse={false} className="h-2.5" style={{ width: captionWidth }} />
      </span>
      <Skeleton pulse={false} className="h-7.5 w-16 rounded-sm" />
    </Pulse>
  );
}
