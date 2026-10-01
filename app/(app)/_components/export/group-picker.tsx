"use client";

import { motion } from "motion/react";
import { Rise } from "@/components/motion/rise";
import { ALL_GROUPS, type ExportGroup } from "@/lib/export/rules";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";
import { exportCopy } from "./_data";
import { ExportGroupTile } from "./export-form";

export interface GroupPickerProps {
  groups: readonly ExportGroup[];
  value: string;
  onPick: (group: string) => void;
}

export function GroupPicker({ groups, value, onPick }: GroupPickerProps) {
  const copy = exportCopy.groups;
  const totalBills = groups.reduce((sum, group) => sum + group.counts.bills, 0);
  const options = [
    { id: ALL_GROUPS, group: null, name: copy.all, caption: `${copy.groupsCap(groups.length)} · ${copy.billsCap(totalBills)}` },
    ...groups.map((group) => ({
      id: group.id,
      group,
      name: group.name,
      caption: `${copy.billsCap(group.counts.bills)} · ${copy.peopleCap(group.people)}`,
    })),
  ];

  return (
    <Rise role="radiogroup" aria-label={copy.label} className="grid gap-0.5">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              buzz(HAPTICS.select);
              onPick(option.id);
            }}
            className={cn(
              "grid min-h-16 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-control px-3 text-left text-text",
              "transition-[background-color] duration-150 ease-standard hover:bg-surface",
              selected ? "bg-surface" : "bg-transparent",
            )}
          >
            <ExportGroupTile group={option.group} />
            <span className="grid min-w-0">
              <span className="truncate font-medium">{option.name}</span>
              <span className="truncate text-footnote text-text-2">{option.caption}</span>
            </span>
            <span
              aria-hidden
              className={cn(
                "grid size-5.5 place-items-center rounded-full border-[1.5px] transition-[border-color] duration-150 ease-standard",
                selected ? "border-brand" : "border-border",
              )}
            >
              <motion.span initial={false} animate={{ scale: selected ? 1 : 0 }} className="size-3 rounded-full bg-brand" />
            </span>
          </button>
        );
      })}
    </Rise>
  );
}
