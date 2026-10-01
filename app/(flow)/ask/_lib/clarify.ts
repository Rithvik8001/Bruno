import { currencySymbol, formatMoney } from "@/lib/currency";
import { shortDay } from "@/lib/dates";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { AskClarifyQuestion, AskPick } from "@/lib/ask/result";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { askCopy } from "../_data";
import { dayDate, monthLabel } from "./period";

const copy = askCopy.clarify;

export type ClarifyLead =
  | { readonly kind: "person"; readonly person: PersonView }
  | { readonly kind: "group"; readonly group: BillGroupRef }
  | { readonly kind: "calendar" }
  | { readonly kind: "bill" }
  | { readonly kind: "amount"; readonly symbol: string };

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

const act = askCopy.act.clarify;

export function clarifyView(question: AskClarifyQuestion, now: Date = new Date()): ClarifyView {
  if (question.slot === "bill") {
    return {
      title: act.bill.title,
      sub: act.bill.sub(question.options.length),
      options: question.options.map((option) => ({
        pick: { slot: "bill", ref: option.ref },
        label: option.bill.title,
        sub: act.billSub(option.bill.group.name, shortDay(dayDate(option.bill.day), now), formatMoney(option.bill.total, option.bill.currency)),
        lead: { kind: "bill" },
      })),
    };
  }
  if (question.slot === "amount") {
    const name = question.other.displayName;
    const owed = formatMoney(question.owed, question.currency);
    return {
      title: act.amount.title,
      sub: question.direction === "paid" ? act.amount.subPaid(name, owed, question.group.name) : act.amount.subReceived(name, owed, question.group.name),
      options: question.options.map((option) => ({
        pick: { slot: "amount", ref: option.ref },
        label: option.amount === null ? act.other : formatMoney(option.amount, question.currency),
        sub: option.ref === "all" ? act.all : option.ref === "half" ? act.half : act.otherSub,
        lead: { kind: "amount", symbol: currencySymbol(question.currency) },
      })),
    };
  }
  if (question.slot === "payment") {
    return {
      title: act.payment.title,
      sub: act.payment.sub(question.options.length),
      options: question.options.map((option) => ({
        pick: { slot: "payment", ref: option.ref },
        label: act.paymentLabel(firstNameOf(option.from.displayName), formatMoney(option.amount, option.currency)),
        sub: act.paymentSub(option.group.name, shortDay(new Date(option.at), now)),
        lead: { kind: "person", person: option.from },
      })),
    };
  }
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
