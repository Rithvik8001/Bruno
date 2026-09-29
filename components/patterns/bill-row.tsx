"use client";

import { PressLink } from "@/components/motion/motion-link";
import { StatusChip, Tag } from "@/components/ui/chip";
import type { BillDisplayStatus } from "@/lib/bills/status";
import type { GroupArtId } from "@/lib/design-system/icons3d";
import type { BillStatus } from "@/lib/design-system/semantics";
import type { PaletteTint } from "@/lib/design-system/tokens";

const chipStatus = {
  draft: "queued",
  claiming: "claiming",
  ready: "ready",
  overdue: "overdue",
  settled: "settled",
} as const satisfies Record<BillDisplayStatus, BillStatus>;

export interface BillRowProps {
  href: string;
  title: string;
  status: BillDisplayStatus;
  meta: string;
  total: string;
  when: string;
  group?: { readonly name: string; readonly tint: PaletteTint; readonly art: GroupArtId | null };
}

export function BillRow({ href, title, status, meta, total, when, group }: BillRowProps) {
  return (
    <PressLink
      wide
      href={href}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-text no-underline transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-text"
    >
      <span className="grid min-w-0 gap-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold">{title}</span>
          {group && (
            <Tag tint={group.tint} art={group.art ?? undefined}>
              {group.name}
            </Tag>
          )}
        </span>
        <span className="flex min-w-0 items-center gap-2 text-footnote text-text-2">
          <StatusChip status={chipStatus[status]} size="xs" />
          <span className="truncate">{meta}</span>
        </span>
      </span>
      <span className="grid justify-items-end gap-0.5">
        <span className="font-semibold">{total}</span>
        <span className="text-caption font-normal whitespace-nowrap text-muted">{when}</span>
      </span>
    </PressLink>
  );
}
