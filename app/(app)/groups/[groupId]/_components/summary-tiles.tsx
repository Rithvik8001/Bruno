import { balanceTint } from "@/lib/design-system/semantics";
import type { Tint } from "@/lib/design-system/tokens";
import type { GroupDetail } from "@/lib/groups/queries";
import { formatMoney } from "@/lib/currency";
import { cents, type Cents } from "@/lib/money";
import { groupDetailCopy } from "../_data";

function Tile({ label, value, tint }: { label: string; value: string; tint?: Tint }) {
  return (
    <div className="grid gap-0.5 rounded-tile bg-surface px-4 py-3.5">
      <span className="text-footnote font-medium text-text-2">{label}</span>
      <span data-tint={tint} className={tint ? "text-title text-tint" : "text-title"}>
        {value}
      </span>
    </div>
  );
}

export function SummaryTiles({ group }: { group: GroupDetail }) {
  const money = (value: Cents, signed = false) =>
    `${signed && value > 0 ? "+" : signed && value < 0 ? "−" : ""}${formatMoney(cents(Math.abs(value)), group.currency)}`;
  const direction = group.yourBalance > 0 ? "owed" : group.yourBalance < 0 ? "owes" : "settled";
  const copy = groupDetailCopy.summary;
  const label = direction === "owed" ? copy.owed : direction === "owes" ? copy.owe : copy.square;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
      <Tile label={copy.spent} value={money(group.spent)} />
      <Tile label={copy.share} value={money(group.yourShare)} />
      <Tile label={label} value={money(group.yourBalance, true)} tint={balanceTint[direction]} />
    </div>
  );
}
