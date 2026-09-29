"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { StepSwap } from "@/components/motion/rise";
import { Receipt } from "@/components/ui/receipt";
import { EASE, SPRING, T } from "@/lib/motion/tokens";
import type { Tint } from "@/lib/design-system/tokens";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface ScanLine {
  readonly id: string;
  readonly name: string;
  readonly price: Cents;
  readonly category: string;
  readonly tint: Tint;
  readonly ghostWidth: `${number}%`;
}

export interface ReceiptScanProps {
  merchant: string;
  lines: readonly ScanLine[];
  total: Cents;
  progress: number | null;
  className?: string;
}

type ScanPhase = "idle" | "edges" | "reading" | "totalling" | "ready";

const lineRevealAt = (i: number) => 18 + i * 14;
const TOTAL_AT = 92;
const HEADER_AT = 8;
const EDGES_UNTIL = 12;

function phaseOf(progress: number | null, found: number, lineCount: number): ScanPhase {
  if (progress === null) return "idle";
  if (progress >= TOTAL_AT) return "ready";
  if (progress < EDGES_UNTIL) return "edges";
  return found === lineCount ? "totalling" : "reading";
}

const chipByPhase = {
  idle: { tint: "muted", label: () => "Idle" },
  edges: { tint: "brand", label: () => "Reading" },
  reading: { tint: "brand", label: (n: number) => (n ? `Found ${n}` : "Reading") },
  totalling: { tint: "brand", label: (n: number) => `Found ${n}` },
  ready: { tint: "green", label: () => "Ready" },
} as const satisfies Record<ScanPhase, { tint: Tint; label: (found: number) => string }>;

const FADE = { duration: T.t3, ease: EASE } as const;
const PRINT = { duration: T.t2, ease: EASE } as const;
const BEAM_STEP = { duration: 0.14, ease: "linear" } as const;
const SPARKLE_PULSE = { duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } as const;

function beamOffset(p: number): `${number}%` {
  return `${Math.min(100, 6 + Math.max(0, p) * 0.94)}%`;
}

function ScanSparkle() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="absolute right-3.5 -bottom-1.5 inline-flex text-brand"
      initial={{ opacity: 0.55 }}
      animate={reduce ? { opacity: 1 } : { opacity: [0.55, 1] }}
      transition={reduce ? FADE : SPARKLE_PULSE}
    >
      <Icon name="sparkle" size={14} />
    </motion.span>
  );
}

export function ReceiptScan({ merchant, lines, total, progress, className }: ReceiptScanProps) {
  const p = progress ?? -1;
  const revealed = lines.map((_, i) => p >= lineRevealAt(i));
  const found = revealed.filter(Boolean).length;
  const phase = phaseOf(progress, found, lines.length);
  const last = found > 0 ? lines[found - 1] : undefined;
  const chip = chipByPhase[phase];
  const totalOn = phase === "ready";
  const beamOn = phase !== "idle" && phase !== "ready";

  const caption = {
    idle: ["Press run to watch it read.", " "],
    edges: ["Finding the edges…", "Straightening the photo."],
    reading: last
      ? [`Spotted ${last.name}`, `${last.category} · ${formatCents(last.price)}`]
      : ["Reading line by line…", "Looking for items and prices."],
    totalling: ["Adding it up…", "Checking tax and tip match."],
    ready: ["Got it all.", `${lines.length} items · adds up to $${formatCents(total)}`],
  }[phase];

  return (
    <div className={cn("w-full max-w-85", className)}>
      <Receipt bodyClassName="relative overflow-hidden pt-3.5">
        <div className="mb-2 flex min-h-7 items-center justify-between">
          <motion.span
            className="font-semibold"
            initial={false}
            animate={{ opacity: p >= HEADER_AT ? 1 : 0.2 }}
            transition={FADE}
          >
            {merchant}
          </motion.span>
          <span
            data-tint={chip.tint}
            aria-live="polite"
            className="inline-flex h-6.5 items-center gap-1.5 rounded-[7px] bg-tint-bg pr-2.25 pl-1.75 text-caption text-tint transition-colors duration-220"
          >
            <Icon name="sparkle" size={12} />
            {chip.label(found)}
          </span>
        </div>

        {lines.map((line, i) => {
          const on = revealed[i] === true;
          return (
            <div key={line.id} className="relative flex min-h-10 items-center justify-between gap-4 border-t border-line">
              <motion.span
                aria-hidden
                className="absolute top-[calc(50%-5px)] left-0 h-2.5 rounded-full bg-surface-2"
                style={{ width: line.ghostWidth }}
                initial={false}
                animate={{ opacity: on ? 0 : 1 }}
                transition={FADE}
              />
              <motion.span
                aria-hidden
                className="absolute top-[calc(50%-5px)] right-0 h-2.5 w-11 rounded-full bg-surface-2"
                initial={false}
                animate={{ opacity: on ? 0 : 1 }}
                transition={FADE}
              />
              <motion.span
                className="flex min-w-0 items-center gap-2"
                initial={false}
                animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                transition={PRINT}
              >
                <span className="text-small font-medium whitespace-nowrap">{line.name}</span>
                <motion.span
                  data-tint={line.tint}
                  className="inline-flex h-5 items-center rounded-xs bg-tint-bg px-1.75 text-[11px] font-semibold text-tint"
                  initial={false}
                  animate={on ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                  transition={on ? { ...SPRING, delay: 0.18 } : PRINT}
                >
                  {line.category}
                </motion.span>
              </motion.span>
              <motion.span
                className="text-small font-semibold"
                initial={false}
                animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                transition={{ ...PRINT, delay: on ? 0.08 : 0 }}
              >
                {formatCents(line.price)}
              </motion.span>
            </div>
          );
        })}

        <div className="mt-1 flex min-h-11 items-center justify-between border-t border-border">
          <motion.span
            className="font-semibold"
            initial={false}
            animate={{ opacity: totalOn ? 1 : 0.25 }}
            transition={FADE}
          >
            Total
          </motion.span>
          <motion.span
            className="text-lead font-semibold"
            initial={false}
            animate={totalOn ? { opacity: 1, y: 0 } : { opacity: 0.25, y: 4 }}
            transition={FADE}
          >
            ${formatCents(total)}
          </motion.span>
        </div>

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ y: beamOffset(p), opacity: beamOn ? 1 : 0 }}
          transition={{ y: BEAM_STEP, opacity: FADE }}
        >
          <div className="absolute inset-x-0 -top-14 h-16">
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-brand-tint" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
            {beamOn && <ScanSparkle />}
          </div>
        </motion.div>
      </Receipt>

      <div className="mt-3 min-h-10">
        <StepSwap stepKey={`${phase}-${last?.id ?? ""}`} className="grid justify-items-center gap-0.5 text-center">
          <span className="text-small font-semibold">{caption[0]}</span>
          <span className="text-footnote text-text-2">{caption[1]}</span>
        </StepSwap>
      </div>
    </div>
  );
}
