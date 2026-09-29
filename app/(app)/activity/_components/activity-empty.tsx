import { Rise } from "@/components/motion/rise";
import { MomentTile } from "@/components/ui/icon-3d";
import { activityCopy } from "../_data";

export function ActivityEmpty() {
  const copy = activityCopy.empty;
  return (
    <Rise className="grid min-h-80 place-items-center rounded-card bg-surface px-6 py-8 text-center">
      <div className="grid max-w-[30ch] justify-items-center gap-3.5">
        <MomentTile icon="hourglass" tint="cyan" size="lg" />
        <span className="text-lead font-semibold">{copy.title}</span>
        <span className="text-small text-text-2">{copy.body}</span>
      </div>
    </Rise>
  );
}
