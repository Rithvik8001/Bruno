import { AvatarStack } from "@/components/ui/avatar-stack";
import { currencySymbol } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { tellCopy } from "../_data";

export interface KnownMembersProps {
  composer: BillComposer;
  you: PersonId;
}

export function KnownMembers({ composer, you }: KnownMembersProps) {
  const copy = tellCopy.compose;
  const others = composer.members.filter((m) => m.id !== you);
  const symbol = currencySymbol(composer.currency);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AvatarStack
        size="sm"
        max={5}
        people={composer.members.map((m) => ({ id: m.id, name: m.displayName, tint: m.tint, buddy: m.buddy }))}
        className="shrink-0"
      />
      <span className="min-w-0 text-footnote text-text-2">
        {others.length === 0
          ? copy.knowsSolo(composer.name, symbol)
          : copy.knows(
              others.map((m) => firstNameOf(m.displayName)),
              symbol,
            )}
      </span>
    </div>
  );
}
