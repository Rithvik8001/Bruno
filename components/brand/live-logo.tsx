"use client";

import Link from "next/link";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { fireConfetti } from "@/lib/motion/confetti";
import { EASE } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { MARK_PATH } from "./bruno-mark";

const FIRST_BLINK_MS = 2500;
const MIN_GAP_MS = 4000;
const GAP_SPAN_MS = 6000;
const TAP_WINDOW_MS = 900;
const PARTY_TAPS = 5;

export const logoCopy = {
  party: "Hi. I’m Bruno. I count so you don’t have to.",
} as const;

export function LiveMark({ size = 30, className }: { size?: number; className?: string }) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let id: number;
    const blink = (delay: number) => {
      id = window.setTimeout(() => {
        void animate(scope.current, { scaleY: [1, 0.15, 1] }, { duration: 0.22, ease: EASE });
        blink(MIN_GAP_MS + Math.random() * GAP_SPAN_MS);
      }, delay);
    };
    blink(FIRST_BLINK_MS);
    return () => window.clearTimeout(id);
  }, [animate, reduce, scope]);

  return (
    <motion.svg
      ref={scope}
      width={size}
      height={size}
      viewBox="0 0 44 45"
      fill="currentColor"
      aria-hidden
      className={cn("shrink-0 text-text", className)}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
    </motion.svg>
  );
}

export interface LogoLinkProps extends Omit<ComponentProps<typeof Link>, "children"> {
  children: ReactNode;
}

export function LogoLink({ onClick, children, ...rest }: LogoLinkProps) {
  const { toast } = useToast();
  const taps = useRef(0);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const tap = (e: MouseEvent<HTMLAnchorElement>) => {
    taps.current += 1;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      taps.current = 0;
    }, TAP_WINDOW_MS);
    if (taps.current >= PARTY_TAPS) {
      e.preventDefault();
      taps.current = 0;
      fireConfetti(e.currentTarget);
      toast({ message: logoCopy.party });
    } else if (taps.current > 1) {
      e.preventDefault();
    }
    onClick?.(e);
  };

  return (
    <Link onClick={tap} {...rest}>
      {children}
    </Link>
  );
}
