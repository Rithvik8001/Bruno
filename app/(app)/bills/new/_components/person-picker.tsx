"use client";

import { Avatar } from "@/components/ui/avatar";
import type { PersonId } from "@/lib/domain/ids";
import { useRovingSelection } from "@/lib/hooks/use-roving-selection";
import type { PersonView } from "@/lib/people/person";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "../_data";
import { shortName, type Roster } from "../_lib/people";

export interface PersonPickerProps {
  members: readonly PersonView[];
  roster: Roster;
  you: PersonId;
  value: PersonId;
  onValueChange: (id: PersonId) => void;
}

export function PersonPicker({ members, roster, you, value, onValueChange }: PersonPickerProps) {
  const copy = newBillCopy.claim;
  const { register, onKeyDown } = useRovingSelection(
    members.map((m) => m.id),
    value,
    onValueChange,
  );

  return (
    <div className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{copy.assigning}</span>
      <div role="radiogroup" aria-label={copy.assigning} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {members.map((m) => {
          const selected = m.id === value;
          return (
            <button
              key={m.id}
              ref={register(m.id)}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(m.id)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full pr-3.5 pl-1 text-small font-medium",
                "transition-[background-color,color,box-shadow] duration-150 ease-standard active:scale-95",
                selected
                  ? "bg-brand-tint text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]"
                  : "bg-surface text-text-2 hover:bg-surface-2 hover:text-text",
              )}
            >
              <Avatar name={m.displayName} tint={m.tint} buddy={m.buddy} size="md" />
              {shortName(m.id, roster, you, copy.you)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
