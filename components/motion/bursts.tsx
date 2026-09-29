"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion/tokens";

const STAR_PATH = "M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z";
const SCRAP_TINTS = ["--violet", "--pink", "--amber", "--green", "--blue", "--brand-tint"] as const;

function spread(i: number, count: number, step: number): number {
  return -Math.PI / 2 + (i - (count - 1) / 2) * step;
}

export function SparkleBurst({ count = 3 }: { count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute top-3 left-1/2 z-10">
      {Array.from({ length: count }, (_, i) => {
        const angle = spread(i, count, 0.7);
        const r = 22;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        return (
          <motion.svg
            key={i}
            width={8}
            height={8}
            viewBox="0 0 10 10"
            fill="currentColor"
            className="absolute -top-1 -left-1 text-brand"
            initial={{ x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 0 }}
            animate={{
              x: [0, x * 0.6, x],
              y: [0, y * 0.6, y],
              scale: [0.3, 1.1, 0.4],
              rotate: [0, 40, 90],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.62, ease: EASE, times: [0, 0.4, 1] }}
          >
            <path d={STAR_PATH} />
          </motion.svg>
        );
      })}
    </span>
  );
}

export function ScrapBurst({ count = 10 }: { count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-10">
      {Array.from({ length: count }, (_, i) => {
        const angle = spread(i, count, 2.4 / count);
        const v = 40 + ((i * 37) % 40);
        const w = 4 + (i % 3);
        const spin = (i % 2 === 0 ? 1 : -1) * (270 + i * 30);
        return (
          <motion.span
            key={i}
            className="absolute rounded-[1.5px]"
            style={{ width: w, height: w * 1.5, left: -w / 2, top: (-w * 1.5) / 2, background: `var(${SCRAP_TINTS[i % SCRAP_TINTS.length]})` }}
            initial={{ x: 0, y: 0, scale: 0.4, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, Math.cos(angle) * v, Math.cos(angle) * v * 1.2],
              y: [0, Math.sin(angle) * v, Math.sin(angle) * v + 30],
              scale: [0.4, 1, 1],
              rotate: [0, spin * 0.75, spin],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.7 + (i % 4) * 0.08, ease: [0.15, 0.7, 0.4, 1], times: [0, 0.6, 1] }}
          />
        );
      })}
    </span>
  );
}

export function DotBurst({ count = 12 }: { count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-10">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = 70 + ((i * 13) % 40);
        const size = 5 + (i % 3);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-tint"
            style={{ width: size, height: size, left: -size / 2, top: -size / 2 }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(angle) * r, y: Math.sin(angle) * r, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.62 + (i % 3) * 0.1, ease: EASE }}
          />
        );
      })}
    </span>
  );
}
