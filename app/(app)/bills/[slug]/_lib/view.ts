import type { BillDetail, BillPersonRow, ShareBasis } from "@/lib/bills/queries";
import { FULL_PERCENT_BPS } from "@/lib/bills/types";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import type { Tint } from "@/lib/design-system/tokens";
import type { PersonId } from "@/lib/domain/ids";
import { cents, negateCents, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { billDetailCopy } from "../_data";

const copy = billDetailCopy;

export function nameOf(person: PersonView, you: PersonId): string {
  return person.id === you ? copy.you : firstNameOf(person.displayName);
}

export function payerWord(detail: BillDetail, you: PersonId): string {
  return detail.payer.id === you ? copy.you.toLowerCase() : firstNameOf(detail.payer.displayName);
}

export function percentText(bps: number): string {
  const pct = bps / (FULL_PERCENT_BPS / 100);
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
}

export function statusChip(detail: BillDetail, you: PersonId): { readonly label: string; readonly tint: Tint } {
  const payer = payerWord(detail, you);
  switch (detail.status) {
    case "settled":
      return { label: copy.status.settled, tint: "green" };
    case "overdue":
      return { label: copy.status.overdue(detail.owingCount, payer), tint: "red" };
    default:
      return { label: copy.status.open(detail.owingCount, payer), tint: "orange" };
  }
}

export function personStatusLabel(row: BillPersonRow, payer: string): string {
  const status = copy.people.status;
  switch (row.status) {
    case "payer":
      return status.payer;
    case "paid":
      return status.paid;
    case "owes":
      return status.owes(payer);
    case "out":
      return status.out;
  }
}

function lineCaption(line: { name: string; quantity: number; sharedWith: readonly PersonId[] }): string {
  const label = line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name;
  if (line.sharedWith.length === 0) return label;
  if (line.sharedWith.length === 1) return copy.basis.half(label);
  return copy.basis.split(label, line.sharedWith.length + 1);
}

export function basisCaption(basis: ShareBasis | null): string {
  if (!basis) return copy.people.notInSplit;
  switch (basis.kind) {
    case "items":
      return basis.lines.map(lineCaption).join(", ");
    case "even":
      return copy.basis.even(basis.ways);
    case "shares":
      return copy.basis.shares(basis.shares, basis.of);
    case "percent":
      return copy.basis.percent(percentText(basis.bps));
    case "amount":
      return copy.basis.amount;
  }
}

export interface ExplainLine {
  readonly label: string;
  readonly amount: string;
  readonly strong?: boolean;
}

export function explainShare(
  row: BillPersonRow,
  detail: BillDetail,
  you: PersonId,
  names: ReadonlyMap<PersonId, string>,
): ExplainLine[] {
  const share = row.share;
  if (!share || !row.basis) return [];
  const money = (value: Cents) => formatMoney(value, detail.currency);
  const name = nameOf(row.person, you);
  const lines: ExplainLine[] = [];

  if (row.basis.kind === "items") {
    for (const line of row.basis.lines) {
      const who =
        line.sharedWith.length === 0
          ? copy.explain.mine(name)
          : copy.explain.shared(
              line.sharedWith.map((id) => (id === you ? copy.you.toLowerCase() : (names.get(id) ?? ""))).join(", "),
            );
      lines.push({ label: `${line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name} · ${who}`, amount: money(line.amount) });
    }
    lines.push({ label: copy.explain.items, amount: money(share.items), strong: true });
  } else {
    lines.push({ label: basisCaption(row.basis), amount: money(share.items) });
  }

  if (share.discount > 0) lines.push({ label: copy.explain.discount, amount: money(negateCents(share.discount)) });
  const extras = cents(share.tax + share.tip);
  if (extras > 0) {
    const pct = share.items > 0 ? percentText(Math.round((extras / share.items) * FULL_PERCENT_BPS)) : null;
    lines.push({ label: pct ? copy.explain.extras(pct) : copy.explain.extrasFlat, amount: money(extras) });
  }

  const payer = payerWord(detail, you);
  const closing =
    row.status === "owes" || (row.status === "paid" && detail.payer.id !== row.person.id)
      ? copy.explain.owes(name, payer)
      : copy.explain.share(name);
  lines.push({ label: closing, amount: money(share.total), strong: true });
  return lines;
}

export function shareSummary(detail: BillDetail, you: PersonId, currency: CurrencyCode): string {
  const payer = detail.payer.id === you ? copy.you : firstNameOf(detail.payer.displayName);
  const payerLower = payerWord(detail, you);
  return [
    copy.summary.head(detail.title, detail.group.name, formatMoney(detail.charges.total, currency)),
    copy.summary.paidBy(payer),
    ...detail.people
      .filter((row) => row.share !== null)
      .map((row) =>
        copy.summary.line(nameOf(row.person, you), formatMoney(row.share?.total ?? cents(0), currency), personStatusLabel(row, payerLower)),
      ),
  ].join("\n");
}
