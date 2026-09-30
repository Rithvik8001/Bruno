import type { ReactNode } from "react";

export interface FlowFooterProps {
  children: ReactNode;
  action: ReactNode;
}

export function FlowFooter({ children, action }: FlowFooterProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="grid min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}
