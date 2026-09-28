import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={cn("block rounded-xs bg-surface-2", className)} style={style} />;
}

export function ListRowSkeleton({
  titleWidth = "50%",
  captionWidth = "30%",
}: {
  titleWidth?: `${number}%`;
  captionWidth?: `${number}%`;
}) {
  return (
    <div className="grid min-h-16 animate-pulse-soft grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
      <Skeleton className="size-10 rounded-full" />
      <span className="grid gap-2">
        <Skeleton className="h-3" style={{ width: titleWidth }} />
        <Skeleton className="h-2.5" style={{ width: captionWidth }} />
      </span>
      <Skeleton className="h-7.5 w-16 rounded-sm" />
    </div>
  );
}
