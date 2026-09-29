"use client";

import Link from "next/link";
import { motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { routes } from "@/lib/auth/rules";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SPRING, SPRING_CURVE } from "@/lib/motion/tokens";
import { shellCopy } from "../../_data";
import { ScrapBurst } from "@/components/motion/bursts";

const MotionLink = motion.create(Link);

export function AddButton({ rest }: { rest: TargetAndTransition }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [spins, setSpins] = useState(0);

  return (
    <MotionLink
      href={routes.newBill}
      aria-label={shellCopy.addBill}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onPointerDown={() => buzz(HAPTICS.addPress)}
      onTap={() => setSpins((n) => n + 1)}
      animate={rest}
      whileTap={{ scale: 0.86, transition: { duration: 0.13, ease: "easeOut" } }}
      transition={SPRING}
      className="pointer-events-auto relative grid size-14.5 place-items-center rounded-full bg-brand text-on-brand no-underline shadow-[0_12px_26px_-8px_color-mix(in_oklab,var(--brand)_70%,transparent),inset_0_1px_0_rgba(255,255,255,.35),inset_0_-2px_0_rgba(0,0,0,.12)] transition-colors hover:bg-brand-hover hover:text-on-brand"
    >
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0 0px color-mix(in oklab, var(--brand) 40%, transparent)",
              "0 0 0 14px color-mix(in oklab, var(--brand) 0%, transparent)",
              "0 0 0 14px color-mix(in oklab, var(--brand) 0%, transparent)",
            ],
          }}
          transition={{ duration: 3.8, times: [0, 0.6, 1], ease: "easeOut", delay: 1.2, repeat: Infinity }}
        />
      )}
      <motion.span
        className="grid"
        animate={{ rotate: spins * 180 + (hover ? 90 : 0) }}
        transition={{ duration: 0.45, ease: SPRING_CURVE }}
      >
        <Icon name="plus" size={24} strokeWidth={2.2} />
      </motion.span>
      {spins > 0 && <ScrapBurst key={spins} />}
    </MotionLink>
  );
}
