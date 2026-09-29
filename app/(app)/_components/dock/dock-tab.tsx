"use client";

import Link from "next/link";
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Transition } from "motion/react";
import { useEffect } from "react";
import { Icon } from "@/components/icons/icon";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { SPRING, SPRING_CURVE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import type { AppNavItem } from "../../_data";
import { SparkleBurst } from "@/components/motion/bursts";
import { BELL } from "@/lib/motion/keyframes";
import { UnreadDot } from "../unread-dot";

const HOP = {
  y: [0, -8, 0, 0, 0],
  rotate: [0, -10, 0, 0, 0],
  scaleX: [1, 1.12, 1.18, 0.96, 1],
  scaleY: [1, 1.12, 0.84, 1.04, 1],
};
const HOP_TIMING: Transition = { duration: 0.56, ease: "easeOut", times: [0, 0.35, 0.68, 0.85, 1] };
const JELLY = { scaleX: [0.4, 1.08, 0.97, 1], scaleY: [0.6, 0.9, 1.03, 1], opacity: [0, 1, 1, 1] };

export interface DockTabProps {
  item: AppNavItem;
  active: boolean;
  hovered: boolean;
  landing: boolean;
  badge: boolean;
  onHover: (href: string | null) => void;
}

export function DockTab({ item, active, hovered, landing, badge, onHover }: DockTabProps) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (active && !reduce) void animate(scope.current, HOP, { ...HOP_TIMING, delay: landing ? 0.26 : 0 });
  }, [active, animate, landing, reduce, scope]);

  useEffect(() => {
    if (!badge || reduce) return;
    const id = window.setTimeout(() => void animate(scope.current, BELL.keyframes, BELL.transition), 1020);
    return () => window.clearTimeout(id);
  }, [badge, animate, reduce, scope]);

  const press = () => {
    buzz(HAPTICS.press);
    if (!reduce) void animate(scope.current, { scaleX: 1.18, scaleY: 0.8 }, { duration: 0.12, ease: "easeOut" });
  };
  const release = () => {
    if (!reduce) void animate(scope.current, { ...HOP, scaleX: [1.18, ...HOP.scaleX.slice(1)], scaleY: [0.8, ...HOP.scaleY.slice(1)] }, HOP_TIMING);
  };

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={active ? undefined : item.label}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(item.href)}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={() => void animate(scope.current, { scaleX: 1, scaleY: 1 }, SPRING)}
      className={cn(
        "relative flex h-12 items-center rounded-full no-underline transition-colors duration-250",
        active ? "gap-2 pr-4.5 pl-3.5 text-small font-semibold text-brand hover:text-brand" : "w-12 justify-center text-text-2 hover:text-text",
      )}
    >
      {active && (
        <motion.span
          layoutId="dock-blob"
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-brand-tint"
          initial={landing ? { scaleX: 0.4, scaleY: 0.6, opacity: 0 } : false}
          animate={landing ? JELLY : { scaleX: 1, scaleY: 1, opacity: 1 }}
          transition={{ layout: SPRING, default: { duration: 0.62, ease: "easeOut", delay: 0.12, times: [0, 0.55, 0.8, 1] } }}
        />
      )}
      <AnimatePresence>
        {hovered && !active && (
          <motion.span
            layoutId="dock-ghost"
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_oklab,var(--text)_6%,transparent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ layout: SPRING, opacity: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
      <span ref={scope} className="grid origin-[50%_80%]">
        <Icon name={item.icon} size={20} />
      </span>
      {active && item.label}
      {active && <SparkleBurst key={item.href} />}
      {badge && <UnreadDot className="top-2.75 right-3" />}
      {!active && (
        <span className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-10 -translate-x-1/2">
          <AnimatePresence>
            {hovered && (
              <motion.span
                className="relative block h-6.5 rounded-sm bg-text px-2.5 text-caption leading-6.5 font-semibold whitespace-nowrap text-bg after:absolute after:top-full after:left-1/2 after:-ml-1 after:border-4 after:border-transparent after:border-t-text"
                initial={{ opacity: 0, y: 6, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9, transition: { duration: 0.14 } }}
                transition={{ duration: 0.34, ease: SPRING_CURVE }}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </Link>
  );
}
