import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";
import { checkTint, type CheckTone } from "../data";

export interface CheckBannerProps {
  tone: CheckTone;
  children: ReactNode;
  action?: { readonly label: string; readonly onAction: () => void };
}

export function CheckBanner({ tone, children, action }: CheckBannerProps) {
  return (
    <div
      role="status"
      data-tint={checkTint[tone]}
      className={cn(
        "flex items-center gap-2.5 rounded-tile py-3 pl-3.5 text-small font-medium",
        "transition-[background-color,color] duration-200 ease-standard",
        tone === "neutral" ? "bg-surface text-text-2" : "bg-tint-bg text-tint",
        action ? "pr-2" : "pr-3.5",
      )}
    >
      <Icon name={tone === "ok" ? "check" : "alert"} size={18} strokeWidth={2.2} className="shrink-0" />
      <span className="flex-1">{children}</span>
      {action && (
        <button
          type="button"
          onClick={action.onAction}
          className="h-8 shrink-0 cursor-pointer rounded-sm bg-bg px-2.5 text-footnote font-semibold whitespace-nowrap text-text"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
