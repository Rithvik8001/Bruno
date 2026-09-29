"use client";

import { ClaimRow as ClaimRowView } from "@/components/patterns/claim-row";
import { formatAmount, type CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { PersonView } from "@/lib/people/person";
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

export function ClaimRow({ line, selected, roster, you, currency, onToggle }: ClaimRowProps) {
  const copy = composerCopy.claim;
  const claimed = line.claimants.length > 0;
  const faces = line.claimants.flatMap((id): PersonView[] => {
    const person = roster.get(id);
    return person ? [person] : [];
  });

  return (
    <ClaimRowView
      name={line.name}
      quantity={line.quantity}
      price={formatAmount(line.price, currency)}
      each={line.each === null ? null : copy.each(formatAmount(line.each, currency))}
      caption={claimed ? namesOf(line.claimants, roster, you, copy.you) : copy.tapHint(shortName(selected, roster, you, copy.you))}
      claimed={claimed}
      mine={line.claimants.includes(selected)}
      faces={faces}
      onToggle={onToggle}
    />
  );
}
