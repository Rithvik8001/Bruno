"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { pressMotion } from "@/components/motion/press";
import { useToast } from "@/components/ui/toast";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";
import { groupDetailCopy } from "../_data";

const RESET_MS = 2000;

export interface CopyLinkButtonProps {
  url: string;
  label?: string;
  variant?: "surface" | "floating";
  className?: string;
}

export function CopyLinkButton({ url, label = groupDetailCopy.inviteLink, variant = "surface", className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), RESET_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      buzz(HAPTICS.select);
      setCopied(true);
    } catch {
      toast({ message: url });
    }
  };

  return (
    <motion.button
      type="button"
      onClick={copy}
      {...pressMotion()}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-control font-semibold transition-colors",
        variant === "surface"
          ? "h-10 bg-surface pr-3.5 pl-2.5 text-small hover:bg-surface-2"
          : "h-9 bg-bg px-3 text-footnote shadow-float",
        copied ? "text-green" : "text-text",
        className,
      )}
    >
      {copied ? (
        <CheckIn key="copied" className="inline-grid">
          <Icon name="check" size={variant === "surface" ? 18 : 16} strokeWidth={2} />
        </CheckIn>
      ) : (
        variant === "surface" && <Icon name="link" size={18} strokeWidth={2} />
      )}
      {copied ? groupDetailCopy.copied : label}
    </motion.button>
  );
}
