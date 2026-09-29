import { formatMoney, type CurrencyCode } from "@/lib/currency";
import type { BalanceDirection } from "@/lib/design-system/semantics";
import type { HomePersonBalance, HomeSummaryData } from "@/lib/home/queries";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { homeCopy } from "../_data";

export interface HomeSummary {
  readonly net: Cents;
  readonly direction: BalanceDirection;
  readonly headline: string;
  readonly amount: string;
  readonly breakdown: string;
  readonly peopleMeta: string;
  readonly others: string | null;
}

export function money(value: Cents, currency: CurrencyCode): string {
  return formatMoney(cents(Math.abs(value)), currency);
}

export function directionOf(value: number): BalanceDirection {
  return value > 0 ? "owed" : value < 0 ? "owes" : "settled";
}

export function personCaption(row: HomePersonBalance): string {
  const copy = homeCopy.people;
  const direction = directionOf(row.primary !== 0 ? row.primary : ([...row.balances.values()][0] ?? 0));
  return direction === "owed"
    ? copy.captionOwed(row.openTitles)
    : direction === "owes"
      ? copy.captionOwes(row.openTitles)
      : copy.captionSquare;
}

export function homeSummary(data: HomeSummaryData): HomeSummary {
  const currency = data.primaryCurrency;
  const net = data.net.get(currency) ?? ZERO_CENTS;
  const direction = directionOf(net);
  const owed = data.people.filter((p) => p.primary > 0);
  const owes = data.people.filter((p) => p.primary < 0);
  const { breakdown, people: peopleCopy } = homeCopy;
  const others = [...data.net]
    .filter(([code, amount]) => code !== currency && amount !== 0)
    .map(([code, amount]) => `${amount < 0 ? "−" : "+"}${money(amount, code)}`);

  return {
    net,
    direction,
    headline: homeCopy.headline[direction],
    amount: money(net, currency),
    breakdown: [
      ...owed.map((p) => breakdown.owed(firstNameOf(p.person.displayName), money(p.primary, currency))),
      ...owes.map((p) => breakdown.owes(firstNameOf(p.person.displayName), money(p.primary, currency))),
    ].join(" · "),
    peopleMeta: [
      owed.length > 0 ? peopleCopy.owesYou(owed.length) : null,
      owes.length > 0 ? peopleCopy.youOwe(owes.length) : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" · "),
    others: others.length > 0 ? homeCopy.others(others) : null,
  };
}
