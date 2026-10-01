"use client";

import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import { cn } from "@/lib/utils/cn";
import { tellCopy } from "../_data";
import type { TellFailureKind } from "../_lib/phase";

export interface TellFailedCardProps {
  failure: TellFailureKind;
  example: string;
  manualHref: string;
  canRetry: boolean;
  onRetry: () => void;
}

export function TellFailedCard({ failure, example, manualHref, canRetry, onRetry }: TellFailedCardProps) {
  const copy = tellCopy.failed;
  const vague = failure === "vague";
  return (
    <Rise role="alert" className="grid gap-4 rounded-card bg-surface p-5">
      <div className="flex items-start gap-3.5">
        <MomentTile icon={vague ? "memo" : "warning"} tint={vague ? "amber" : "red"} size="md" />
        <span className="grid min-w-0 gap-1">
          <span className="font-semibold">{vague ? copy.vague.title : copy.network.title}</span>
          <span className="text-small text-pretty text-text-2">{vague ? copy.vague.body(example) : copy.network.body}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="md" disabled={!canRetry} onClick={onRetry} className="h-11 text-small">
          {copy.again}
        </Button>
        <PressLink href={manualHref} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 text-small")}>
          {copy.type}
        </PressLink>
      </div>
    </Rise>
  );
}
