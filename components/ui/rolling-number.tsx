"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

const NUMBER = /\d[\d,]*(?:\.\d+)?/;

const SPEEDS = {
  hero: { duration: 0.9, ease: [0.25, 1, 0.5, 1] },
  live: { duration: 0.42, ease: [0.33, 1, 0.68, 1] },
} as const;

export type RollSpeed = keyof typeof SPEEDS;

interface ParsedNumber {
  readonly prefix: string;
  readonly suffix: string;
  readonly value: number;
  readonly decimals: number;
  readonly grouped: boolean;
}

function parse(text: string): ParsedNumber | null {
  const match = NUMBER.exec(text);
  if (!match) return null;
  const raw = match[0];
  const decimals = raw.split(".")[1]?.length ?? 0;
  return {
    prefix: text.slice(0, match.index),
    suffix: text.slice(match.index + raw.length),
    value: Number(raw.replace(/,/g, "")),
    decimals,
    grouped: raw.includes(","),
  };
}

function format(n: number, decimals: number, grouped: boolean): string {
  const fixed = n.toFixed(decimals);
  return grouped ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : fixed;
}

export interface RollingNumberProps {
  value: string;
  speed?: RollSpeed;
  className?: string;
}

export function RollingNumber({ value, speed = "hero", className }: RollingNumberProps) {
  const parsed = parse(value);
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduce = useReducedMotion();
  const target = parsed?.value ?? 0;
  const decimals = parsed?.decimals ?? 0;
  const grouped = parsed?.grouped ?? false;

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    const render = (n: number) => {
      shown.current = n;
      el.textContent = format(n, decimals, grouped);
    };
    if (reduce) {
      render(target);
      return;
    }
    const controls = animate(shown.current, target, { ...SPEEDS[speed], onUpdate: render });
    return () => controls.stop();
  }, [target, decimals, grouped, speed, reduce]);

  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span className={cn("tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {parsed.prefix}
        <span ref={node}>{format(parsed.value, decimals, grouped)}</span>
        {parsed.suffix}
      </span>
    </span>
  );
}
