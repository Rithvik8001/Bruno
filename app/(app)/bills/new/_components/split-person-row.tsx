"use client";

import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { PersonView } from "@/lib/people/person";
import { newBillCopy } from "../_data";

export interface SplitPersonRowProps {
  person: PersonView;
  name: string;
  caption: string;
  included: boolean;
  total: string | null;
  onToggle: () => void;
  control: ReactNode;
}

export function SplitPersonRow({ person, name, caption, included, total, onToggle, control }: SplitPersonRowProps) {
  const copy = newBillCopy.split;
  return (
    <div className="grid min-h-17 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line first:border-t-0">
      <button
        type="button"
        aria-pressed={included}
        aria-label={copy.toggle(name)}
        onClick={onToggle}
        className={cn(
          "size-10 cursor-pointer rounded-full bg-transparent p-0 transition-[opacity,transform] duration-150 ease-standard active:scale-95",
          !included && "opacity-40",
        )}
      >
        <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
      </button>
      <span className="grid min-w-0">
        <span className={cn("truncate font-medium", !included && "text-muted")}>{name}</span>
        <span className="truncate text-footnote text-text-2">{included ? caption : copy.out}</span>
      </span>
      <span className="flex items-center gap-2.5">
        {included && control}
        <span className={cn("min-w-16 text-right font-semibold", included ? "text-text" : "text-muted")}>
          {included && total !== null ? total : copy.empty}
        </span>
      </span>
    </div>
  );
}
