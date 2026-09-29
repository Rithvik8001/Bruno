"use client";

import { Avatar } from "@/components/ui/avatar";
import { CheckIndicator } from "@/components/ui/checkbox";
import { formatAmount, type CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import { cn } from "@/lib/utils/cn";
import { composerCopy } from "../data";
import type { ClaimLine } from "../lib/derive";
import { namesOf, shortName, type Roster } from "../lib/people";

export interface ClaimRowProps {
  line: ClaimLine;
  selected: PersonId;
  roster: Roster;
  you: PersonId;
  currency: CurrencyCode;
  onToggle: () => void;
}

const MAX_FACES = 3;

export function ClaimRow({ line, selected, roster, you, currency, onToggle }: ClaimRowProps) {
  const copy = composerCopy.claim;
  const mine = line.claimants.includes(selected);
  const claimed = line.claimants.length > 0;

  return (
    <button
      type="button"
      aria-pressed={mine}
      onClick={onToggle}
      className={cn(
        "grid min-h-15 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line bg-transparent p-0 text-left",
        "transition-[transform,opacity] duration-150 ease-standard active:scale-[0.985] active:opacity-70",
        "focus-visible:rounded-xs focus-visible:-outline-offset-2",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <CheckIndicator checked={mine} className={mine ? "animate-check-in" : undefined} />
        <span className="grid min-w-0">
          <span className="truncate font-medium">
            {line.name}
            {line.quantity > 1 && ` ×${line.quantity}`}
          </span>
          <span className={cn("min-h-4.5 truncate text-footnote", claimed ? "text-text-2" : "text-muted")}>
            {claimed ? namesOf(line.claimants, roster, you, copy.you) : copy.tapHint(shortName(selected, roster, you, copy.you))}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="flex">
          {line.claimants.slice(0, MAX_FACES).map((id) => {
            const person = roster.get(id);
            return person ? (
              <Avatar
                key={id}
                name={person.displayName}
                tint={person.tint}
                buddy={person.buddy}
                size="sm"
                className="-ml-1.5 animate-pop-in ring-2 ring-surface first:ml-0"
              />
            ) : null;
          })}
        </span>
        <span className="grid justify-items-end">
          <span className={mine ? "font-semibold" : "font-medium"}>{formatAmount(line.price, currency)}</span>
          {line.each !== null && (
            <span className="text-caption font-normal text-muted">{copy.each(formatAmount(line.each, currency))}</span>
          )}
        </span>
      </span>
    </button>
  );
}
