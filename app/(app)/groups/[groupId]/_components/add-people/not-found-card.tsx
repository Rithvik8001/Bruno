"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { MomentTile } from "@/components/ui/icon-3d";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";
import { groupDetailCopy } from "../../_data";

const RESET_MS = 2000;

export interface NotFoundCardProps {
  query: string;
  guess: string;
  inviteUrl: string;
  onAddByName: () => void;
}

const actionClass =
  "flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-control bg-bg text-small font-semibold shadow-float";

export function NotFoundCard({ query, guess, inviteUrl, onAddByName }: NotFoundCardProps) {
  const copy = groupDetailCopy.addPeople;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), RESET_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      buzz(HAPTICS.select);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Rise className="grid gap-3.5 rounded-card bg-surface p-4">
      <div className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3">
        <MomentTile icon="envelope" tint="blue" size="sm" className="size-10" />
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate font-semibold">{copy.notFoundTitle(query)}</span>
          <span className="text-small text-text-2">{copy.notFoundBody}</span>
        </span>
      </div>
      <div className="grid gap-2">
        <motion.button type="button" onClick={copyInvite} {...pressMotion(true)} className={cn(actionClass, copied ? "text-green" : "text-text")}>
          {copied && (
            <CheckIn className="inline-grid">
              <Icon name="check" size={16} strokeWidth={2.4} />
            </CheckIn>
          )}
          {copied ? copy.inviteCopied : copy.sendInvite}
        </motion.button>
        <motion.button type="button" onClick={onAddByName} {...pressMotion(true)} className={cn(actionClass, "text-text")}>
          {copy.addByNameInstead(guess)}
        </motion.button>
      </div>
    </Rise>
  );
}
