"use client";

import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/auth/rules";
import type { DuplicateBill } from "@/lib/scans/duplicates";
import { composerCopy } from "../data";

export interface DuplicateBannerProps {
  duplicate: DuplicateBill;
  dayLabel: string;
  onDismiss: () => void;
}

export function DuplicateBanner({ duplicate, dayLabel, onDismiss }: DuplicateBannerProps) {
  const copy = composerCopy.items.duplicate;
  return (
    <Rise
      role="status"
      data-tint="blue"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-tile bg-tint-bg py-3 pr-2 pl-3.5 text-small text-tint"
    >
      <Icon name="copy" size={18} strokeWidth={2} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{copy.title(dayLabel, duplicate.title)}</span> {copy.body}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <PressLink
          href={routes.bill(duplicate.slug)}
          className="inline-flex h-8 items-center rounded-sm px-2.5 text-footnote font-semibold whitespace-nowrap text-tint no-underline hover:bg-bg/60 hover:text-tint"
        >
          {copy.view}
        </PressLink>
        <Button variant="elevated" size="sm" onClick={onDismiss}>
          {copy.keep}
        </Button>
      </span>
    </Rise>
  );
}
