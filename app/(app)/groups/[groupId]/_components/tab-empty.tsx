import type { ReactNode } from "react";
import { Rise } from "@/components/motion/rise";
import { MomentTile } from "@/components/ui/icon-3d";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";

export interface TabEmptyProps {
  moment: MomentIconId;
  tint: PaletteTint;
  title: string;
  body: string;
  action?: ReactNode;
}

export function TabEmpty({ moment, tint, title, body, action }: TabEmptyProps) {
  return (
    <Rise className="grid min-h-60 place-items-center rounded-card bg-surface px-6 py-8 text-center">
      <div className="grid max-w-[30ch] justify-items-center gap-3.5">
        <MomentTile icon={moment} tint={tint} size="md" />
        <div className="grid gap-1">
          <span className="font-semibold">{title}</span>
          <span className="text-small text-text-2">{body}</span>
        </div>
        {action}
      </div>
    </Rise>
  );
}
