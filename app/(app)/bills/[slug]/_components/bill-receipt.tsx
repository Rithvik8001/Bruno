import { Avatar } from "@/components/ui/avatar";
import { Receipt } from "@/components/ui/receipt";
import type { BillDetail } from "@/lib/bills/queries";
import { formatAmount, formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import { cents, negateCents } from "@/lib/money";
import { billDetailCopy } from "../_data";
import { nameOf, percentText } from "../_lib/view";

const MAX_FACES = 3;

export function BillReceipt({ detail, you }: { detail: BillDetail; you: PersonId }) {
  const copy = billDetailCopy.receipt;
  const byItems = detail.method === "ITEMS";
  const amount = (value: Parameters<typeof formatAmount>[0]) => formatAmount(value, detail.currency);
  const { charges } = detail;

  return (
    <Receipt bodyClassName="grid px-4 pt-2 pb-4">
      <div className="flex items-center justify-between pt-1.5 pb-2 text-caption font-semibold text-muted">
        <span>{copy.items}</span>
        <span>{copy.method[detail.method]}</span>
      </div>
      {detail.items.map((item) => {
        const names = item.claimants.map((p) => nameOf(p, you)).join(", ");
        const each = item.claimants.length > 1 ? cents(Math.round(item.price / item.claimants.length)) : null;
        return (
          <div key={item.id} className="grid min-h-13 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line">
            <span className="grid min-w-0">
              <span className="truncate font-medium">
                {item.name}
                {item.quantity > 1 && ` ×${item.quantity}`}
              </span>
              {byItems && names && (
                <span className="truncate text-footnote text-text-2">
                  {each === null ? names : `${names} · ${copy.each(amount(each))}`}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2.5">
              {byItems && (
                <span aria-hidden className="flex">
                  {item.claimants.slice(0, MAX_FACES).map((p) => (
                    <Avatar
                      key={p.id}
                      name={p.displayName}
                      tint={p.tint}
                      buddy={p.buddy}
                      size="sm"
                      className="-ml-1.5 ring-2 ring-surface first:ml-0"
                    />
                  ))}
                </span>
              )}
              <span className="min-w-12 text-right font-medium">{amount(item.price)}</span>
            </span>
          </div>
        );
      })}
      <div className="grid gap-1.5 border-t border-border pt-2.5 text-small">
        <div className="flex justify-between text-text-2">
          <span>{copy.subtotal}</span>
          <span>{amount(charges.subtotal)}</span>
        </div>
        {charges.discount > 0 && (
          <div className="flex justify-between text-text-2">
            <span>{copy.discount}</span>
            <span className="text-green">{formatAmount(negateCents(charges.discount), detail.currency)}</span>
          </div>
        )}
        {charges.tax > 0 && (
          <div className="flex justify-between text-text-2">
            <span>{copy.tax}</span>
            <span>{amount(charges.tax)}</span>
          </div>
        )}
        {charges.tip > 0 && (
          <div className="flex justify-between text-text-2">
            <span>{charges.tipBps === null ? copy.tip : copy.tipPct(percentText(charges.tipBps))}</span>
            <span>{amount(charges.tip)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-1.5 text-lead font-semibold">
          <span>{copy.total}</span>
          <span>{formatMoney(charges.total, detail.currency)}</span>
        </div>
      </div>
    </Receipt>
  );
}
