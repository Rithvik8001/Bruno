import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TearOffStubProps {
  children: ReactNode;
  tearOff: ReactNode;
  done?: ReactNode;
  torn: boolean;
  className?: string;
}

export function TearOffStub({ children, tearOff, done, torn, className }: TearOffStubProps) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <div className="grid gap-4 rounded-t-card bg-surface px-5 pt-5 pb-4 [&>*]:min-w-0">{children}</div>
      <div aria-hidden className="mx-3 border-t-2 border-dashed border-border" />
      <div className="grid">
        <div
          inert={torn}
          className={cn(
            "[grid-area:1/1] grid origin-top-left gap-2.5 rounded-b-card px-5 pt-4 pb-5",
            "transition-[transform,opacity,background-color,box-shadow] duration-[520ms,420ms,220ms,220ms] ease-standard",
            torn
              ? "translate-x-4.5 translate-y-14 -rotate-6 bg-bg opacity-0 shadow-float delay-[0ms,120ms,0ms,0ms]"
              : "bg-surface",
          )}
        >
          {tearOff}
        </div>
        {torn && done && (
          <div
            role="status"
            className="[grid-area:1/1] grid animate-rise gap-4 rounded-b-card bg-surface px-5 pt-4 pb-5 [animation-delay:360ms]"
          >
            {done}
          </div>
        )}
      </div>
    </div>
  );
}
