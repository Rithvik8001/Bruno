"use client";

import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import { formatMoney } from "@/lib/currency";
import type { ScanSummary } from "@/lib/scans/actions";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "../_data";

export interface ScanDoneCardProps {
  summary: ScanSummary;
  pending: boolean;
  onReview: () => void;
}

export function ScanDoneCard({ summary, pending, onReview }: ScanDoneCardProps) {
  const copy = newBillCopy.scan.done;
  return (
    <Rise className="grid gap-4 rounded-card bg-surface p-6">
      <div className="flex items-center gap-3.5">
        <MomentTile icon="sparkles" tint="green" size="md" />
        <span className="grid gap-0.5">
          <span className="font-semibold">{copy.title(summary.itemCount, summary.total === null ? null : formatMoney(summary.total, summary.currency))}</span>
          <span className="text-small text-text-2">{copy.sub(summary.merchant, summary.flaggedCount)}</span>
        </span>
      </div>
      <Button size="lg" fullWidth loading={pending} onClick={onReview}>
        {copy.review}
      </Button>
    </Rise>
  );
}

export interface ScanFailedCardProps {
  reason: string;
  manualHref: string;
  onRetry: () => void;
}

export function ScanFailedCard({ reason, manualHref, onRetry }: ScanFailedCardProps) {
  const copy = newBillCopy.scan.failed;
  return (
    <Rise className="grid gap-4 rounded-card bg-surface p-6">
      <div className="flex items-start gap-3.5">
        <MomentTile icon="warning" tint="red" size="md" />
        <span className="grid gap-1">
          <span className="font-semibold">{copy.title}</span>
          <span className="text-small text-text-2">{copy.body(reason)}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="md" onClick={onRetry}>
          {copy.again}
        </Button>
        <PressLink href={manualHref} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "text-small")}>
          {copy.type}
        </PressLink>
      </div>
    </Rise>
  );
}
