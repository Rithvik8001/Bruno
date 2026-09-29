import type { BalanceDirection } from "@/lib/design-system/semantics";
import type { PersonId } from "@/lib/domain/ids";
import type { FeedAmountSign, FeedItem } from "@/lib/feed/types";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { activityCopy } from "../_data";

export interface FeedLine {
  readonly who: string;
  readonly what: string;
}

const copy = activityCopy;

function subject(person: PersonView | null, you: PersonId): string {
  if (!person) return copy.someone;
  return person.id === you ? copy.you : firstNameOf(person.displayName);
}

function object(person: PersonView | null, you: PersonId): string {
  if (!person) return copy.someone.toLowerCase();
  return person.id === you ? copy.youLower : firstNameOf(person.displayName);
}

function possessive(person: PersonView | null, you: PersonId): string {
  if (person?.id === you) return copy.your;
  return copy.possessive(object(person, you));
}

export function feedLine(item: FeedItem, you: PersonId): FeedLine {
  const actor = subject(item.actor, you);
  const line = copy.line;
  switch (item.kind) {
    case "billAdded":
      return { who: actor, what: line.billAdded(item.title) };
    case "billEdited":
      return { who: actor, what: line.billEdited(item.fields, item.title) };
    case "billDeleted":
      return { who: actor, what: line.billDeleted(item.title) };
    case "payment":
      return {
        who: subject(item.from, you),
        what: item.pending ? line.saysPaid(object(item.to, you)) : line.paid(object(item.to, you)),
      };
    case "paymentConfirmed":
      return { who: actor, what: line.confirmed(possessive(item.from, you)) };
    case "paymentCancelled":
      return {
        who: actor,
        what: item.declined
          ? line.declined(possessive(item.from, you))
          : item.actor?.id === item.from?.id
            ? line.cancelled(object(item.to, you))
            : line.cancelledFrom(possessive(item.from, you)),
      };
    case "memberJoined":
      return {
        who: subject(item.person, you),
        what: item.started ? line.started(item.group.name) : line.joined(item.group.name),
      };
    case "memberLeft":
      return item.removed
        ? { who: actor, what: line.removed(object(item.person, you), item.group.name) }
        : { who: subject(item.person, you), what: line.left(item.group.name) };
  }
}

export const amountDirection = {
  in: "owed",
  out: "owes",
  neutral: "settled",
} as const satisfies Record<FeedAmountSign, BalanceDirection>;
