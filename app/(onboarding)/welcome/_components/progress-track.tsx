import { Avatar } from "@/components/ui/avatar";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { ONBOARDING_STEPS, welcomeCopy } from "../_data";

const STOPS = ["left-2.5", "left-14", "left-25.5"] as const;
const TRAILS = ["w-0", "w-11.5", "w-23"] as const;

export interface ProgressTrackProps {
  position: number;
  name: string;
  tint: PaletteTint;
  buddy: BuddyShape;
}

export function ProgressTrack({ position, name, tint, buddy }: ProgressTrackProps) {
  const total = ONBOARDING_STEPS.length - 1;
  return (
    <div
      role="img"
      aria-label={welcomeCopy.progress(position + 1, total)}
      data-tint={tint}
      className="relative h-7 w-28"
    >
      <span className="absolute inset-x-2.5 top-1/2 border-t-2 border-dotted border-border" />
      <span
        className={cn(
          "absolute top-1/2 left-2.5 -mt-px h-0.5 rounded-full bg-tint transition-[width] duration-500 ease-spring",
          TRAILS[position] ?? TRAILS[TRAILS.length - 1],
        )}
      />
      {STOPS.map((left, i) => (
        <span
          key={left}
          className={cn(
            "absolute top-1/2 -mt-1 -ml-1 size-2 rounded-full transition-colors",
            left,
            i <= position ? "bg-tint" : "bg-border",
          )}
        />
      ))}
      <span
        key={position}
        className={cn(
          "absolute top-1/2 -mt-3 -ml-3 rounded-full ring-2 ring-bg transition-[left] duration-500 ease-spring animate-pop-spring",
          STOPS[position] ?? STOPS[STOPS.length - 1],
        )}
      >
        <Avatar name={name || welcomeCopy.you} tint={tint} buddy={buddy} size="sm" />
      </span>
    </div>
  );
}
