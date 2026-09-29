import { formatAmount, formatMoney, type CurrencyCode } from "@/lib/currency";
import type { OpenLine } from "@/lib/ledger/pair";
import { subtractCents, type Cents } from "@/lib/money";
import { settleCopy } from "../_data";

export const BACK_KINDS = ["home", "bill", "group"] as const;
export type BackKind = (typeof BACK_KINDS)[number];

const BREAKDOWN_LINES = 3;

export function backKindOf(path: string): BackKind {
  if (path.startsWith("/bills/")) return "bill";
  if (path.startsWith("/groups/")) return "group";
  return "home";
}

export function breakdownText(lines: readonly OpenLine[], currency: CurrencyCode): string {
  const shown = lines.slice(0, BREAKDOWN_LINES).map((line) => `${line.title} ${formatAmount(line.amount, currency)}`);
  const more = lines.length - shown.length;
  return [shown.join(" + "), more > 0 ? settleCopy.breakdownMore(more) : null].filter(Boolean).join(" ");
}

export function remainingText(amount: Cents | null, max: Cents, currency: CurrencyCode): string | null {
  if (amount === null || amount <= 0 || amount >= max) return null;
  return formatMoney(subtractCents(max, amount), currency);
}
