import { currencySymbol } from "@/lib/currency";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { AskClarifyQuestion, AskPick } from "@/lib/ask/result";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { askCopy } from "../_data";
import { monthLabel } from "./period";

const copy = askCopy.clarify;

export type ClarifyLead = { readonly kind: "person"; readonly person: PersonView } | { readonly kind: "group"; readonly group: BillGroupRef } | { readonly kind: "calendar" };

export interface ClarifyOption {
  readonly pick: AskPick;
  readonly label: string;
  readonly sub: string;
  readonly lead: ClarifyLead;
}

export interface ClarifyView {
  readonly title: string;
  readonly sub: string;
  readonly options: readonly ClarifyOption[];
}

export function clarifyView(question: AskClarifyQuestion): ClarifyView {
  if (question.slot === "person") {
    const firsts = new Set(question.options.map((option) => firstNameOf(option.person.displayName).toLowerCase()));
    const shared = firsts.size === 1 ? firstNameOf(question.options[0]?.person.displayName ?? "") : "";
    return {
      title: shared ? copy.person.titleNamed(shared) : copy.person.title,
      sub: copy.person.sub(question.options.length),
      options: question.options.map((option) => ({
        pick: { slot: "person", ref: option.ref },
        label: option.person.displayName,
        sub: option.groups.join(", "),
        lead: { kind: "person", person: option.person },
      })),
    };
  }
  if (question.slot === "group") {
    return {
      title: copy.group.title,
      sub: copy.group.sub,
      options: question.options.map((option) => ({
        pick: { slot: "group", ref: option.ref },
        label: option.group.name,
        sub: copy.groupSub(option.bills, currencySymbol(option.currency)),
        lead: { kind: "group", group: option.group },
      })),
    };
  }
  return {
    title: copy.period.title,
    sub: copy.period.sub,
    options: question.options.map((option) => ({
      pick: { slot: "period", ref: option.ref },
      label: option.from === null ? copy.periods.all : monthLabel(option.from.slice(0, 7)),
      sub: option.from === null ? copy.allTimeSub : option.ref === "monthBefore" ? "" : copy.periods[option.ref],
      lead: { kind: "calendar" },
    })),
  };
}
