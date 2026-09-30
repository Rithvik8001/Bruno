"use client";

import { motion, useMotionValueEvent, useScroll, type TargetAndTransition } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { appNav, shellCopy } from "../../_data";
import { hasBadge, isActive } from "../nav-links";
import { AddButton } from "./add-button";
import { DockTab } from "./dock-tab";

const TUCK_DELTA = 6;
const TUCK_TOP = 40;
const TUCKED: TargetAndTransition = { y: 6, scale: 0.93 };
const SHOWN: TargetAndTransition = { y: 0, scale: 1 };
const TUCK_SPRING = { type: "spring", duration: 0.5, bounce: 0.35 } as const;

function useTucked(): boolean {
  const { scrollY } = useScroll();
  const [tucked, setTucked] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const dy = y - (scrollY.getPrevious() ?? y);
    if (y < TUCK_TOP || dy < -TUCK_DELTA) setTucked(false);
    else if (dy > TUCK_DELTA) setTucked(true);
  });
  return tucked;
}

function useFirstPaint(): boolean {
  const first = useRef(true);
  const [landing, setLanding] = useState(true);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const id = window.setTimeout(() => setLanding(false), 800);
    return () => window.clearTimeout(id);
  }, []);
  return landing;
}

export function TabBar({ unread }: { unread: boolean }) {
  const pathname = usePathname();
  const tucked = useTucked();
  const landing = useFirstPaint();
  const [hovered, setHovered] = useState<string | null>(null);
  const rest = tucked ? TUCKED : SHOWN;

  useEffect(() => {
    document.documentElement.dataset.dock = "true";
    return () => {
      delete document.documentElement.dataset.dock;
    };
  }, []);

  return (
    <nav
      aria-label={shellCopy.mainNav}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2.5 px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] nav:hidden"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-35 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--bg)_78%,transparent),transparent)] mask-[linear-gradient(to_top,#000_30%,transparent)] backdrop-blur-md"
      />
      <motion.div
        onPointerLeave={() => setHovered(null)}
        animate={rest}
        transition={TUCK_SPRING}
        className={cn(
          "pointer-events-auto relative isolate flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--text)_8%,transparent)] bg-[color-mix(in_oklab,var(--bg)_70%,transparent)] p-1.25 backdrop-blur-[24px] backdrop-saturate-[1.8]",
          "shadow-[0_14px_34px_-10px_rgba(26,25,23,.28),0_2px_6px_rgba(26,25,23,.06),inset_0_1px_0_rgba(255,255,255,.65)]",
          "dark:border-white/8 dark:bg-[color-mix(in_oklab,#1A1A1A_72%,transparent)] dark:shadow-[0_14px_34px_-10px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.07)]",
        )}
      >
        {appNav.map((item) => (
          <DockTab
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            hovered={hovered === item.href}
            landing={landing}
            badge={hasBadge(unread, item.href, pathname)}
            onHover={setHovered}
          />
        ))}
      </motion.div>
      <AddButton rest={{ ...rest, transition: TUCK_SPRING }} />
    </nav>
  );
}
