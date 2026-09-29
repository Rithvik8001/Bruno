"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint, Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import type { ExplainLine } from "../_lib/view";

export interface PersonShareItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
  readonly caption: string;
  readonly total: string | null;
  readonly status: { readonly label: string; readonly tint: Tint };
  readonly expandLabel: string;
  readonly lines: readonly ExplainLine[];
}

function PersonShareRow({ item, open, onToggle }: { item: PersonShareItem; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  const expandable = item.lines.length > 0;
  const summary = (
    <>
      <Avatar name={item.displayName} tint={item.tint} buddy={item.buddy} size="xl" />
      <span className="grid min-w-0">
        <span className="truncate font-medium">{item.name}</span>
        <span className="truncate text-footnote text-text-2">{item.caption}</span>
      </span>
      <span className="flex items-center gap-2">
        {item.total !== null && <span className="font-semibold">{item.total}</span>}
        <Chip tint={item.status.tint} size="sm" className="font-semibold">
          {item.status.label}
        </Chip>
        {expandable && (
          <Icon
            name="chevron-down"
            size={16}
            className={cn("text-muted transition-transform duration-200 ease-standard", open && "rotate-180")}
          />
        )}
      </span>
    </>
  );
  const row = "grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 px-3.5 py-3 text-left";

  return (
    <div className="rounded-tile bg-surface">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={item.expandLabel}
          onClick={onToggle}
          className={cn(row, "cursor-pointer rounded-tile bg-transparent")}
        >
          {summary}
        </button>
      ) : (
        <div className={row}>{summary}</div>
      )}
      {expandable && (
        <div
          id={panelId}
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-standard",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="grid gap-1.5 pr-3.5 pb-3.5 pl-[68px] text-small text-text-2">
              {item.lines.map((line, index) => (
                <div
                  key={`${line.label}-${index}`}
                  className={cn(
                    "flex justify-between gap-3",
                    line.strong && "font-medium text-text",
                    index === item.lines.length - 1 && "border-t border-line pt-1.5 font-semibold",
                  )}
                >
                  <span className="min-w-0">{line.label}</span>
                  <span className="shrink-0">{line.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PersonShareList({ title, items }: { title: string; items: readonly PersonShareItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section className="grid gap-2">
      <h2 className="m-0 text-body font-semibold">{title}</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <PersonShareRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
          />
        ))}
      </div>
    </section>
  );
}
