"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  readonly icon: IconName;
  readonly tint: Tint;
  readonly shortcut?: string;
  readonly keywords?: readonly string[];
  readonly onSelect: () => void;
}

export interface CommandMenuProps {
  items: readonly CommandItem[];
  onClose?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

function matches(item: CommandItem, q: string): boolean {
  if (!q) return true;
  const hay = [item.label, item.group, ...(item.keywords ?? [])].join(" ").toLowerCase();
  return hay.includes(q);
}

export function CommandMenu({
  items,
  onClose,
  placeholder = "Add a bill, settle, find a group…",
  emptyMessage = "Nothing matches.",
  className,
}: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => matches(i, q));
  }, [items, query]);

  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const activeItem = results[activeIndex];
  const optionId = (id: string) => `${listId}-${id}`;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((activeIndex + 1) % Math.max(1, results.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((activeIndex - 1 + results.length) % Math.max(1, results.length));
        break;
      case "Enter":
        e.preventDefault();
        activeItem?.onSelect();
        break;
      case "Escape":
        if (onClose) {
          e.preventDefault();
          onClose();
        }
        break;
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-120 overflow-hidden rounded-card border border-line bg-bg shadow-float",
        className,
      )}
    >
      <div className="flex h-13 items-center gap-3 border-b border-line px-4">
        <Icon name="search" size={18} className="text-muted" />
        <input
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={activeItem ? optionId(activeItem.id) : undefined}
          aria-label="Search commands"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 border-0 bg-transparent outline-none focus-visible:outline-none"
        />
        <kbd className="rounded-xs bg-surface px-1.5 py-0.75 font-sans text-[11px] font-semibold text-muted">
          esc
        </kbd>
      </div>
      <ul id={listId} role="listbox" className="m-0 max-h-[calc(6*2.75rem+1rem)] overflow-y-auto p-2">
        {results.map((item, i) => (
          <li
            key={item.id}
            id={optionId(item.id)}
            role="option"
            aria-selected={i === activeIndex}
            onMouseEnter={() => setActive(i)}
            onClick={item.onSelect}
            className={cn(
              "flex h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-control px-2.5 text-small font-medium",
              i === activeIndex && "bg-surface",
            )}
          >
            <span className="flex items-center gap-2.5">
              <span
                data-tint={item.tint}
                className="grid size-6.5 place-items-center rounded-sm bg-tint-bg text-tint"
              >
                <Icon name={item.icon} size={14} strokeWidth={2.2} />
              </span>
              <span>{item.label}</span>
              <span className="text-caption font-medium text-muted">{item.group}</span>
            </span>
            {item.shortcut && <kbd className="font-sans text-[11px] font-semibold text-muted">{item.shortcut}</kbd>}
          </li>
        ))}
        {results.length === 0 && (
          <li role="presentation" className="grid h-11 list-none place-items-center text-small text-text-2">
            {emptyMessage}
          </li>
        )}
      </ul>
    </div>
  );
}
