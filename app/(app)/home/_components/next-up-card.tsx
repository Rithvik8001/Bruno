"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cents, formatCents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { homeCopy, type HomePerson, type NextUp } from "../_data";

export interface NextUpCardProps {
  person: HomePerson;
  nextUp: NextUp;
}

const MAX_NUDGES = 3;

export function NextUpCard({ person, nextUp }: NextUpCardProps) {
  const [nudges, setNudges] = useState(0);
  const [shaking, setShaking] = useState(false);
  const { toast } = useToast();
  const copy = homeCopy.nextUp;
  const first = firstNameOf(person.name);

  const nudge = () => {
    if (nudges >= MAX_NUDGES) {
      toast({ message: copy.enough(first) });
      return;
    }
    const message = copy.toasts[nudges]?.(first) ?? copy.enough(first);
    toast({
      message,
      icon: "check",
      tint: "green",
      action: nudges === 0 ? { label: copy.undo, onAction: () => setNudges(0) } : undefined,
    });
    if (nudges === MAX_NUDGES - 1) setShaking(true);
    setNudges(nudges + 1);
  };

  const caption = `${nextUp.subject} · ${nudges > 0 ? copy.nudged(nudges) : nextUp.age}`;

  return (
    <button
      type="button"
      onClick={nudge}
      onAnimationEnd={() => setShaking(false)}
      className={cn(
        "grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface px-4.5 py-4 text-left transition-colors hover:bg-surface-2",
        shaking && "animate-shake",
      )}
    >
      <Avatar name={person.name} tint={person.tint} buddy={person.buddy} size="xl" className="size-11" />
      <span className="grid min-w-0">
        <span className="font-semibold">{copy.owesYou(first, formatCents(cents(Math.abs(person.balance))))}</span>
        <span className="truncate text-small text-text-2">{caption}</span>
      </span>
      <span className="inline-flex h-9 items-center rounded-control bg-bg px-3.5 text-small font-semibold whitespace-nowrap shadow-float">
        {copy.labels[Math.min(nudges, copy.labels.length - 1)]}
      </span>
    </button>
  );
}
