"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { CheckIndicator } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EXPORT_KINDS, EXPORT_RANGES, type ExportCounts, type ExportGroup, type ExportKind, type ExportRange } from "@/lib/export/rules";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { cn } from "@/lib/utils/cn";
import { exportCopy, exportCount } from "./_data";
import type { ExportState } from "./_lib/state";
import type { ExportSummary } from "./_lib/summary";

const labelClass = "text-footnote font-semibold text-text-2";
const tileClass = "size-10 rounded-[12px]";
const rangeOptions = EXPORT_RANGES.map((value) => ({ value, label: exportCopy.dates.ranges[value] }));

export function ExportGroupTile({ group }: { group: ExportGroup | null }) {
  if (group) return <GroupArtTile name={group.name} tint={group.tint} art={group.art} size="sm" className={tileClass} />;
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center bg-brand-tint text-brand", tileClass)}>
      <Icon name="grid" size={20} />
    </span>
  );
}

export interface ExportBanner {
  readonly tint: "red" | "amber";
  readonly title: string;
  readonly body: string;
}

export interface ExportFormProps {
  state: ExportState;
  today: string;
  group: ExportGroup | null;
  groupCount: number;
  counts: ExportCounts | null;
  summary: ExportSummary;
  banner: ExportBanner | null;
  locked: boolean;
  onPickGroup: () => void;
  onRange: (range: ExportRange) => void;
  onFrom: (day: string) => void;
  onTo: (day: string) => void;
  onToggle: (kind: ExportKind) => void;
}

export function ExportForm({
  state,
  today,
  group,
  groupCount,
  counts,
  summary,
  banner,
  locked,
  onPickGroup,
  onRange,
  onFrom,
  onTo,
  onToggle,
}: ExportFormProps) {
  const copy = exportCopy;
  const alert = useRef<HTMLDivElement>(null);
  const alertTitle = banner?.title ?? null;

  useEffect(() => {
    if (alertTitle) alert.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [alertTitle]);

  return (
    <>
      <div
        aria-busy={locked}
        inert={locked}
        className={cn("grid gap-5 transition-opacity duration-200 ease-standard", locked && "opacity-50")}
      >
        <div className="grid gap-2">
          <span className={labelClass}>{copy.groups.label}</span>
          <button
            type="button"
            aria-haspopup="listbox"
            onClick={onPickGroup}
            className="grid min-h-15 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-tile bg-surface px-3 py-2.5 text-left text-text transition-[background-color,transform] duration-150 ease-standard hover:bg-surface-2 active:scale-[0.99]"
          >
            <ExportGroupTile group={group} />
            <span className="grid min-w-0">
              <span className="truncate font-semibold">{group ? group.name : copy.groups.all}</span>
              <span className="text-footnote text-text-2">
                {group ? copy.groups.peopleCap(group.people) : copy.groups.groupsCap(groupCount)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-small font-medium text-text-2">
              {copy.groups.change}
              <Icon name="chevron-right" size={16} />
            </span>
          </button>
        </div>

        <div className="grid gap-2">
          <span className={labelClass}>{copy.dates.label}</span>
          <SegmentedControl
            label={copy.dates.label}
            options={rangeOptions}
            value={state.range}
            onValueChange={onRange}
            className="max-[359px]:grid max-[359px]:h-auto max-[359px]:grid-cols-2 max-[359px]:[&>button]:h-10.5"
          />
          {state.range === "custom" && (
            <Rise className="grid grid-cols-2 gap-2.5">
              <DatePicker label={copy.dates.from} value={state.from} today={today} onValueChange={onFrom} align="start" fieldClassName="min-w-0" />
              <DatePicker label={copy.dates.to} value={state.to} today={today} onValueChange={onTo} fieldClassName="min-w-0" />
            </Rise>
          )}
        </div>

        <div className="grid gap-2">
          <span className={labelClass}>{copy.include.label}</span>
          <div className="grid divide-y divide-line rounded-tile bg-surface px-3.5">
            {EXPORT_KINDS.map((kind) => {
              const on = state.kinds[kind];
              const words = copy.include.kinds[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => {
                    buzz(HAPTICS.addPress);
                    onToggle(kind);
                  }}
                  className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 bg-transparent py-3.5 text-left text-text active:opacity-80"
                >
                  <CheckIndicator checked={on} />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{words.name}</span>
                      <span className="text-footnote font-medium text-text-2">{on && counts ? exportCount(counts[kind]) : ""}</span>
                    </span>
                    <span className="text-footnote text-pretty text-text-2">{words.description}</span>
                    <motion.span
                      aria-hidden
                      initial={false}
                      animate={{ opacity: on ? 1 : 0.45 }}
                      className="mt-1.5 flex flex-wrap gap-1"
                    >
                      {words.columns.map((column) => (
                        <span
                          key={column}
                          className="inline-flex h-5.5 items-center rounded-[6px] bg-bg px-1.75 text-caption font-medium whitespace-nowrap text-text-2"
                        >
                          {column}
                        </span>
                      ))}
                    </motion.span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div aria-live="polite" className="grid gap-1.5">
        {summary.text && (
          <span className={cn("text-small font-semibold text-pretty", summary.empty ? "text-text-2" : "text-text")}>{summary.text}</span>
        )}
        {summary.zip && <span className="text-footnote text-text-2">{copy.summary.zip}</span>}
        {summary.big && (
          <span className="flex items-center gap-1.5 text-footnote text-text-2">
            <Icon name="clock" size={14} strokeWidth={2.2} className="shrink-0" />
            {copy.summary.big}
          </span>
        )}
        <span className="text-footnote text-pretty text-text-2">{copy.summary.privacy}</span>
      </div>

      {banner && (
        <div ref={alert}>
          <InlineAlert tint={banner.tint} className="rounded-tile">
            <span className="grid gap-0.5">
              <span className="font-semibold">{banner.title}</span>
              <span className="text-footnote text-text-2">{banner.body}</span>
            </span>
          </InlineAlert>
        </div>
      )}
    </>
  );
}
