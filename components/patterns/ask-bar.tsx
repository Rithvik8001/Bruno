"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { cn } from "@/lib/utils/cn";

export interface AskBarProps {
  href: string;
  micHref: string;
  title: string;
  example: string;
  micLabel: string;
  locked: { readonly title: string; readonly body: string } | null;
  className?: string;
}

const subscribe = () => () => undefined;
const canListen = () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

export function AskBar({ href, micHref, title, example, micLabel, locked, className }: AskBarProps) {
  const listens = useSyncExternalStore(subscribe, canListen, () => false);
  if (locked) {
    return (
      <div className={cn("flex min-h-15 items-center gap-3 rounded-card bg-surface py-1.5 pr-4 pl-4", className)}>
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-surface-2 text-muted">
          <Icon name="lock" size={16} strokeWidth={2} />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="font-semibold text-text-2">{locked.title}</span>
          <span className="text-footnote text-muted">{locked.body}</span>
        </span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex min-h-15 items-center gap-1 rounded-card border border-line bg-bg py-1.5 pr-1.5 pl-1 shadow-float transition-colors duration-150 ease-standard hover:border-brand",
        className,
      )}
    >
      <PressLink wide href={href} aria-label={title} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-tile pr-2 pl-3 text-text no-underline hover:text-text">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-brand-tint text-brand">
          <Icon name="sparkle" size={16} />
        </span>
        <span className="grid min-w-0">
          <span className="font-semibold">{title}</span>
          <span className="truncate text-footnote text-muted">{example}</span>
        </span>
      </PressLink>
      {listens && (
        <PressLink
          href={micHref}
          aria-label={micLabel}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-text no-underline transition-colors duration-150 ease-standard hover:bg-brand-tint hover:text-brand"
        >
          <Icon name="mic" size={20} strokeWidth={1.9} />
        </PressLink>
      )}
    </div>
  );
}
