import { Icon } from "@/components/icons/icon";
import { Chip } from "@/components/ui/chip";
import { formatCents } from "@/lib/money";
import { askPreview } from "../_data";
import { SurfaceCard } from "../_components/primitives";

export function AskVisual() {
  return (
    <div className="grid gap-2.5">
      <span className="px-0.5 text-lead font-semibold tracking-[-0.01em] text-pretty">{askPreview.question}</span>
      <SurfaceCard className="grid gap-4.5 p-5">
        <div className="flex min-h-7 min-w-0 items-center gap-2.5">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-sm bg-brand-tint text-brand">
            <Icon name="sparkle" size={14} />
          </span>
          <span className="min-w-0 flex-1 text-footnote font-semibold text-text-2">{askPreview.eyebrow}</span>
        </div>
        <div className="grid min-w-0 gap-0.5">
          <span className="text-small font-medium text-text-2">{askPreview.caption}</span>
          <span className="text-[min(44px,12vw)] leading-[1.1] font-semibold tracking-[-0.03em] whitespace-nowrap">
            {formatCents(askPreview.total)}
          </span>
          <span className="text-footnote text-muted">{askPreview.sub}</span>
        </div>
        <div className="grid gap-3">
          <div aria-hidden className="flex h-3 gap-0.75">
            {askPreview.segments.map((segment) => (
              <span
                key={segment.label}
                data-tint={segment.tint}
                style={{ flexGrow: segment.amount, flexBasis: 0 }}
                className="min-w-1.5 rounded-[4px] bg-tint"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {askPreview.segments.map((segment) => (
              <Chip key={segment.label} tint={segment.tint} size="sm" dot className="h-7.5">
                {segment.label}
                <span className="font-medium">{formatCents(segment.amount)}</span>
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3.5 text-footnote text-muted">
          <Icon name="receipt" size={14} strokeWidth={2} className="shrink-0" />
          <span>{askPreview.foot}</span>
        </div>
      </SurfaceCard>
    </div>
  );
}
