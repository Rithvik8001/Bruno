import { currencies, DEFAULT_CURRENCY } from "@/lib/currency";
import type { BalanceDirection } from "@/lib/design-system/semantics";
import { firstNameOf } from "@/lib/people/defaults";
import { cents, formatCents, sumCents, type Cents } from "@/lib/money";
import { homeCopy, type HomePerson } from "../_data";

export interface HomeSummary {
  readonly net: Cents;
  readonly direction: BalanceDirection;
  readonly headline: string;
  readonly amount: string;
  readonly breakdown: string;
  readonly peopleMeta: string;
}

const symbol = currencies[DEFAULT_CURRENCY].symbol;

export function money(value: Cents): string {
  return `${symbol}${formatCents(cents(Math.abs(value)))}`;
}

export function directionOf(value: Cents): BalanceDirection {
  return value > 0 ? "owed" : value < 0 ? "owes" : "settled";
}

export function homeSummary(people: readonly HomePerson[]): HomeSummary {
  const net = sumCents(people.map((p) => p.balance));
  const direction = directionOf(net);
  const owed = people.filter((p) => p.balance > 0);
  const owes = people.filter((p) => p.balance < 0);
  const { breakdown, people: peopleCopy } = homeCopy;

  return {
    net,
    direction,
    headline: homeCopy.headline[direction],
    amount: money(net),
    breakdown: [
      ...owed.map((p) => breakdown.owed(firstNameOf(p.name), money(p.balance))),
      ...owes.map((p) => breakdown.owes(firstNameOf(p.name), money(p.balance))),
    ].join(" · "),
    peopleMeta: [
      owed.length > 0 ? peopleCopy.owesYou(owed.length) : null,
      owes.length > 0 ? peopleCopy.youOwe(owes.length) : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" · "),
  };
}
