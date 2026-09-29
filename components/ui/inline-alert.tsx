"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { Rise } from "@/components/motion/rise";
import { cn } from "@/lib/utils/cn";

export interface InlineAlertProps {
  children: ReactNode;
  tint?: PaletteTint;
  icon?: IconName;
  className?: string;
}

export function InlineAlert({ children, tint = "red", icon = "alert", className }: InlineAlertProps) {
  return (
    <Rise
      role="alert"
      data-tint={tint}
      className={cn(
        "flex items-start gap-2.5 rounded-control bg-tint-bg px-3.5 py-3 text-small text-tint",
        className,
      )}
    >
      <Icon name={icon} size={18} strokeWidth={2} className="mt-px shrink-0" />
      <span className="flex-1">{children}</span>
    </Rise>
  );
}
