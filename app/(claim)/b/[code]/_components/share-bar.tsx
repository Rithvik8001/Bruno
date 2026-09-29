"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { CopyLinkButton } from "@/components/patterns/copy-link-button";
import { useToast } from "@/components/ui/toast";
import { liveClaimCopy } from "../_data";

export interface ShareBarProps {
  url: string;
  label: string;
  place: string;
}

export function ShareBar({ url, label, place }: ShareBarProps) {
  const copy = liveClaimCopy.share;
  const { toast } = useToast();

  const share = async () => {
    if (typeof navigator.share !== "function") {
      try {
        await navigator.clipboard.writeText(url);
        toast({ message: copy.copiedToast });
      } catch {
        toast({ message: url });
      }
      return;
    }
    try {
      await navigator.share({ title: place, text: copy.shareText(place), url });
    } catch {
      return;
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-tile bg-surface py-1.5 pr-1.5 pl-4">
      <span className="min-w-0 flex-1 truncate text-small text-text-2">{label}</span>
      <CopyLinkButton
        url={url}
        label={copy.copy}
        copiedLabel={copy.copied}
        variant="floating"
        onCopied={() => toast({ message: copy.copiedToast })}
      />
      <motion.button
        type="button"
        aria-label={copy.share}
        onClick={share}
        {...pressMotion()}
        className="grid size-9 cursor-pointer place-items-center rounded-control bg-bg text-text shadow-float"
      >
        <Icon name="upload" size={16} strokeWidth={2} />
      </motion.button>
    </div>
  );
}
