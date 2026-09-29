import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import { Rise } from "@/components/motion/rise";
import { cn } from "@/lib/utils/cn";
import { Icon3d } from "./icon-3d";

export interface EmptyStateProps {
  icon: IconName | { readonly moment: MomentIconId };
  tint?: Tint;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, tint = "violet", message, action, className }: EmptyStateProps) {
  return (
    <Rise className={cn("grid min-h-60 place-items-center rounded-card bg-surface p-6 text-center", className)}>
      <div className="grid justify-items-center gap-3.5">
        <span data-tint={tint} className="grid size-11 place-items-center rounded-tile bg-tint-bg text-tint">
          {typeof icon === "string" ? <Icon name={icon} size={22} /> : <Icon3d icon={icon.moment} size={31} />}
        </span>
        <p className="m-0 max-w-[26ch] text-small text-pretty text-text-2">{message}</p>
        {action}
      </div>
    </Rise>
  );
}
