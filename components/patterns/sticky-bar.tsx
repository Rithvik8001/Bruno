"use client";

import type { ReactNode } from "react";
import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";
import { cn } from "@/lib/utils/cn";

export interface StickyBarProps {
  children: ReactNode;
  className?: string;
}

export function StickyBar({ children, className }: StickyBarProps) {
  const viewport = useVisualViewport();
  const lift = viewport.keyboardOpen ? viewport.keyboardInset : 0;
  return (
    <>
      <div aria-hidden className="h-24 nav:hidden" />
      <div
        style={{ bottom: lift }}
        className={cn(
          "fixed inset-x-0 z-20 border-t border-line bg-bg/85 backdrop-blur-md",
          "nav:static nav:border-0 nav:bg-transparent nav:backdrop-blur-none",
          className,
        )}
      >
        <div className="mx-auto max-w-app px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] nav:p-0 nav:pt-2">{children}</div>
      </div>
    </>
  );
}
