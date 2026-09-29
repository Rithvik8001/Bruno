"use client";

import { motion } from "motion/react";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { Avatar, avatarVariants, type AvatarSize, type StackPerson } from "./avatar";

const LIFT = { type: "spring", duration: 0.2, bounce: 0.3 } as const;

export interface AvatarStackProps {
  people: readonly StackPerson[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarStack({ people, max = 4, size = "md", className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const ring = "ring-2 ring-bg";
  const overlap = size === "sm" ? "-ml-2" : size === "md" ? "-ml-2.5" : "-ml-3";

  return (
    <ul className={cn("flex items-center pl-0", className)} aria-label={`${people.length} people`}>
      {shown.map((p, i) => (
        <motion.li
          key={p.id}
          tabIndex={0}
          initial="rest"
          animate="rest"
          whileHover="lift"
          whileFocus="lift"
          variants={{ rest: { y: 0, scale: 1, zIndex: 0 }, lift: { y: -4, scale: 1.12, zIndex: 10 } }}
          transition={LIFT}
          className={cn("relative list-none rounded-full outline-none", i > 0 && overlap)}
        >
          <Avatar name={p.name} tint={p.tint} initials={p.initials} buddy={p.buddy} size={size} className={ring} />
          <span aria-hidden className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2">
            <motion.span
              variants={{ rest: { opacity: 0, y: 4 }, lift: { opacity: 1, y: 0 } }}
              transition={{ duration: T.t1, ease: EASE }}
              className="flex h-6.5 items-center rounded-sm bg-text px-2.25 text-caption whitespace-nowrap text-bg shadow-float"
            >
              {p.name}
            </motion.span>
          </span>
        </motion.li>
      ))}
      {overflow > 0 && (
        <li className={cn("list-none", overlap)}>
          <span
            data-tint="neutral"
            className={cn(avatarVariants({ size }), ring)}
            aria-label={`and ${overflow} more`}
          >
            +{overflow}
          </span>
        </li>
      )}
    </ul>
  );
}
