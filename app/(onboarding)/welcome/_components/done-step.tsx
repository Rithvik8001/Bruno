"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { PressLink } from "@/components/motion/motion-link";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { fireConfetti } from "@/lib/motion/confetti";
import { WAVE } from "@/lib/motion/keyframes";
import { SPRING_CURVE, T } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { welcomeCopy } from "../_data";
import type { ProfileValue } from "./profile-step";

const POP_STAGGER = 0.09;
const WAVE_START = 0.5;
const WAVE_STAGGER = 0.14;

export interface DoneStepProps {
  profile: ProfileValue;
  friends: readonly PersonView[];
  line: string;
  href: string;
}

export function DoneStep({ profile, friends, line, href }: DoneStepProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [left, right] = friends;
  const party = [
    left ? { key: left.id, name: left.displayName, tint: left.tint, buddy: left.buddy, me: false } : null,
    { key: "me", name: profile.displayName, tint: profile.tint, buddy: profile.buddy, me: true },
    right ? { key: right.id, name: right.displayName, tint: right.tint, buddy: right.buddy, me: false } : null,
  ].filter((p) => p !== null);

  useEffect(() => {
    const stage = scope.current;
    if (!stage) return;
    if (reduce) {
      fireConfetti(stage);
      return;
    }
    let live = true;
    const waves = Array.from(stage.querySelectorAll<HTMLElement>("[data-wave]"), (el, i) =>
      animate(el, WAVE.keyframes, { ...WAVE.transition, delay: WAVE_START + i * WAVE_STAGGER }),
    );
    void Promise.all(waves).then(() => {
      if (live) fireConfetti(stage);
    });
    return () => {
      live = false;
    };
  }, [animate, reduce, scope]);

  return (
    <div className="grid gap-6">
      <div
        ref={scope}
        data-tint={profile.tint}
        className="relative flex h-60 items-center justify-center gap-2.5 rounded-[28px] bg-tint-bg"
      >
        {party.map((p, i) => (
          <motion.span
            key={p.key}
            className="rounded-full ring-4 ring-bg"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: [0.3, 1.12, 1] }}
            transition={{ duration: T.pop, ease: SPRING_CURVE, delay: i * POP_STAGGER }}
          >
            <span data-wave className="block">
              <Avatar name={p.name} tint={p.tint} buddy={p.buddy} size={p.me ? "3xl" : "2xl"} />
            </span>
          </motion.span>
        ))}
      </div>
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading">{welcomeCopy.done.title(firstNameOf(profile.displayName))}</h1>
        <p className="m-0 text-text-2 text-pretty">{line}</p>
      </div>
      <PressLink wide href={href} className={cn(buttonVariants({ size: "lg", fullWidth: true }))}>
        {welcomeCopy.done.cta}
      </PressLink>
    </div>
  );
}
