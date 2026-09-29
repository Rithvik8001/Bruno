"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { pressMotion } from "@/components/motion/press";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { PersonView } from "@/lib/people/person";
import { composerCopy } from "../data";

export interface SplitPersonRowProps {
  person: PersonView;
  name: string;
  caption: string;
  included: boolean;
  total: string | null;
  onToggle: () => void;
  control: ReactNode;
}

export function SplitPersonRow({ person, name, caption, included, total, onToggle, control }: SplitPersonRowProps) {
  const copy = composerCopy.split;
  return (
    <div className="grid min-h-17 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line first:border-t-0">
      <motion.button
        type="button"
        aria-pressed={included}
        aria-label={copy.toggle(name)}
        onClick={onToggle}
        {...pressMotion()}
        className={cn(
          "size-10 cursor-pointer rounded-full bg-transparent p-0 transition-opacity duration-150 ease-standard",
          !included && "opacity-40",
        )}
      >
        <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
      </motion.button>
      <span className="grid min-w-0">
        <span className={cn("truncate font-medium", !included && "text-muted")}>{name}</span>
        <span className="truncate text-footnote text-text-2">{included ? caption : copy.out}</span>
      </span>
      <span className="flex items-center gap-2.5">
        {included && control}
        <span className={cn("min-w-16 text-right font-semibold", included ? "text-text" : "text-muted")}>
          {included && total !== null ? <RollingNumber speed="live" value={total} /> : copy.empty}
        </span>
      </span>
    </div>
  );
}
