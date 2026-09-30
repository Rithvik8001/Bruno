import type { ReactNode } from "react";
import { StickyBar } from "@/components/patterns/sticky-bar";

export interface FlowFooterProps {
  children: ReactNode;
  action: ReactNode;
}

export function FlowFooter({ children, action }: FlowFooterProps) {
  return (
    <StickyBar>
      <div className="flex items-center gap-3">
        <span className="grid min-w-0 flex-1">{children}</span>
        {action}
      </div>
    </StickyBar>
  );
}
