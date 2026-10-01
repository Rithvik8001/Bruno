"use client";

import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { MomentTile } from "@/components/ui/icon-3d";
import { askCopy } from "../_data";

export interface AskErrorCardProps {
  message: string | null;
  canRetry: boolean;
  retryIn: number;
  onRetry: () => void;
}

export function AskErrorCard({ message, canRetry, retryIn, onRetry }: AskErrorCardProps) {
  const copy = askCopy.error;
  return (
    <Rise role="alert" className="grid gap-4 rounded-card bg-surface p-5">
      <div className="flex items-start gap-3.5">
        <MomentTile icon="warning" tint="red" size="md" />
        <span className="grid min-w-0 gap-1">
          <span className="font-semibold">{message ?? copy.title}</span>
          <span className="text-small text-pretty text-text-2">{copy.body}</span>
        </span>
      </div>
      <Button size="md" disabled={!canRetry} onClick={onRetry} className="h-11 justify-self-start text-small disabled:bg-surface-2">
        {retryIn > 0 ? copy.againIn(retryIn) : copy.again}
      </Button>
    </Rise>
  );
}
