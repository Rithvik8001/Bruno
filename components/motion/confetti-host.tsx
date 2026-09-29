"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { confettiSnapshot, emptyConfetti, subscribeConfetti } from "@/lib/motion/confetti";

export function ConfettiHost() {
  const bursts = useSyncExternalStore(subscribeConfetti, confettiSnapshot, emptyConfetti);
  const reduce = useReducedMotion();
  if (reduce || bursts.length === 0) return null;
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1001]">
      {bursts.map((b) =>
        b.pieces.map((p) => (
          <motion.span
            key={`${b.id}-${p.id}`}
            className="absolute rounded-[1.5px]"
            style={{ left: b.x - p.width / 2, top: b.y - p.height / 2, width: p.width, height: p.height, background: `var(${p.tint})` }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, p.dx, p.dx * 1.3],
              y: [0, p.dy, p.dy + p.fall],
              rotate: [0, p.rotate / 2, p.rotate],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: p.duration, ease: [0.15, 0.7, 0.4, 1], times: [0, 0.45, 1] }}
          />
        )),
      )}
    </div>,
    document.body,
  );
}
