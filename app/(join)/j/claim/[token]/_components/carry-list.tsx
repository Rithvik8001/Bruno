import { Icon, type IconName } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/currency";
import type { PaletteTint, Tint } from "@/lib/design-system/tokens";
import type { GuestClaimView } from "@/lib/members/queries";
import { claimCopy } from "../_data";

interface CarryRow {
  readonly icon: IconName;
  readonly tint: PaletteTint;
  readonly title: string;
  readonly sub: string;
  readonly chip?: { readonly label: string; readonly tint: Tint };
}

function rowsOf(view: GuestClaimView): readonly CarryRow[] {
  const { bills, balance, claims, payments } = view;
  const money: CarryRow =
    balance.kind === "square"
      ? { icon: "wallet", tint: "green", title: claimCopy.square, sub: claimCopy.squareSub, chip: { label: claimCopy.settled, tint: "green" } }
      : {
          icon: "wallet",
          tint: balance.kind === "owes" ? "orange" : "green",
          title: balance.kind === "owes" ? claimCopy.owes(balance.counterpart) : claimCopy.owed(balance.counterpart),
          sub: claimCopy.forBills(bills.titles),
          chip: { label: formatMoney(balance.amount, balance.currency), tint: balance.kind === "owes" ? "neutral" : "green" },
        };
  return [
    { icon: "receipt", tint: "blue", title: bills.count > 0 ? claimCopy.bills(bills.count) : claimCopy.noBills, sub: bills.titles.join(", ") },
    money,
    { icon: "clock", tint: "violet", title: claimCopy.history, sub: claimCopy.historySub(claims, payments) },
  ];
}

export function CarryList({ view, addedOn }: { view: GuestClaimView; addedOn: string }) {
  return (
    <div className="grid rounded-card bg-surface px-4 py-1.5">
      <div className="grid min-h-16 grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
        <Avatar name={view.guest.displayName} tint={view.guest.tint} buddy={view.guest.buddy} size="xl" />
        <span className="grid min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{view.guest.displayName}</span>
            <span className="inline-flex h-5 items-center rounded-xs bg-surface-2 px-1.75 text-[11px] font-semibold text-text-2">
              {claimCopy.guestTag}
            </span>
          </span>
          <span className="text-footnote text-text-2">{addedOn}</span>
        </span>
      </div>
      <span className="border-t border-line pt-2.5 pb-0.5 text-footnote font-medium text-muted">{claimCopy.carryTitle}</span>
      {rowsOf(view).map((row) => (
        <div key={row.title} className="grid min-h-14 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3">
          <span data-tint={row.tint} className="grid size-8 place-items-center rounded-control bg-tint-bg text-tint">
            <Icon name={row.icon} size={16} strokeWidth={2} />
          </span>
          <span className="grid min-w-0">
            <span className="text-small font-medium">{row.title}</span>
            {row.sub && <span className="truncate text-footnote text-text-2">{row.sub}</span>}
          </span>
          {row.chip ? (
            <span data-tint={row.chip.tint} className="inline-flex h-6.5 items-center rounded-[7px] bg-tint-bg px-2 text-footnote font-semibold text-tint">
              {row.chip.label}
            </span>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}
