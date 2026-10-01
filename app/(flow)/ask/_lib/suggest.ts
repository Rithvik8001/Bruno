import type { AskSeeds } from "@/lib/ask/queries";
import type { BillGroupRef } from "@/lib/bills/queries";
import { formatMoney } from "@/lib/currency";
import { cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { askCopy } from "../_data";

export type SuggestLead = { readonly kind: "person"; readonly person: PersonView } | { readonly kind: "group"; readonly group: BillGroupRef } | { readonly kind: "sparkle" };

export interface Suggestion {
  readonly text: string;
  readonly lead: SuggestLead;
}

export interface ActionSuggestion {
  readonly text: string;
  readonly icon: "bell" | "arrow-right" | "pencil";
}

const SUGGEST_MAX = 6;
const copy = askCopy.suggest;

export function suggestionsFor(seeds: AskSeeds, scoped: boolean): Suggestion[] {
  const [top, second] = seeds.people;
  const person = (seed: NonNullable<typeof top>): SuggestLead => ({ kind: "person", person: seed.person });
  const group = seeds.group;
  const groupLead: SuggestLead = group ? { kind: "group", group } : { kind: "sparkle" };
  const list: (Suggestion | null)[] = scoped
    ? [
        top ? { text: top.net < 0 ? copy.owe(firstNameOf(top.person.displayName)).replace(" across all groups", "") : copy.owed(firstNameOf(top.person.displayName)), lead: person(top) } : null,
        group ? { text: copy.cost(group.name), lead: groupLead } : null,
        group ? { text: copy.foodHere, lead: groupLead } : null,
        second ? { text: copy.square(firstNameOf(second.person.displayName)), lead: person(second) } : null,
        group ? { text: copy.most, lead: groupLead } : null,
      ]
    : [
        top ? { text: top.net < 0 ? copy.owe(firstNameOf(top.person.displayName)) : copy.owed(firstNameOf(top.person.displayName)), lead: person(top) } : null,
        top && top.net !== 0
          ? {
              text: (top.net < 0 ? copy.why : copy.whyOwed)(firstNameOf(top.person.displayName), formatMoney(cents(Math.abs(top.net)), top.currency), top.group.name),
              lead: person(top),
            }
          : null,
        group ? { text: copy.food(group.name), lead: groupLead } : null,
        seeds.payer ? { text: copy.paid(firstNameOf(seeds.payer.displayName)), lead: { kind: "person", person: seeds.payer } } : null,
        seeds.bill ? { text: copy.changed(seeds.bill.title), lead: { kind: "group", group: seeds.bill.group } } : null,
        group ? { text: copy.cost(group.name), lead: groupLead } : { text: copy.everyone, lead: { kind: "sparkle" } },
      ];
  return list.filter((item): item is Suggestion => item !== null).slice(0, SUGGEST_MAX);
}

export function actionSuggestionsFor(seeds: AskSeeds): ActionSuggestion[] {
  const owes = seeds.people.find((seed) => seed.net < 0);
  const list: (ActionSuggestion | null)[] = [
    seeds.people.some((seed) => seed.net > 0) ? { text: askCopy.act.suggest.remindAll, icon: "bell" } : null,
    owes ? { text: askCopy.act.suggest.settle(firstNameOf(owes.person.displayName)), icon: "arrow-right" } : null,
    seeds.bill ? { text: askCopy.act.suggest.split(seeds.bill.title), icon: "pencil" } : null,
  ];
  return list.filter((item): item is ActionSuggestion => item !== null);
}
