import { Icon } from "@/components/icons/icon";
import { formatCents } from "@/lib/money";
import { settlePreview } from "../_data";

export function SettleVisual() {
  return (
    <div className="relative pb-3">
      <div className="rounded-t-card bg-surface px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <span className="grid">
            <span className="font-semibold">{settlePreview.name}</span>
            <span className="text-footnote text-text-2">owes you</span>
          </span>
          <span className="text-[1.75rem] leading-8.5 font-semibold tracking-[-0.02em] text-green">
            ${formatCents(settlePreview.amount)}
          </span>
        </div>
      </div>
      <div aria-hidden className="mx-3 border-t-2 border-dashed border-border" />
      <div className="origin-top-left translate-x-1.5 translate-y-2.5 -rotate-[1.5deg] rounded-b-card bg-bg px-5 pt-4 pb-5 shadow-float">
        <div className="flex items-center gap-3">
          <span data-tint="green" className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-tint-bg text-tint">
            <Icon name="check-circle" size={20} strokeWidth={2} />
          </span>
          <span className="grid">
            <span className="font-semibold">Settled with {settlePreview.firstName}</span>
            <span className="text-footnote text-text-2">{settlePreview.caption}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
