import { Icon } from "@/components/icons/icon";
import { Chip } from "@/components/ui/chip";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { balanceExplanation, categorisedLines, flaggedLine } from "../_data";
import { MockRow, SurfaceCard } from "../_components/primitives";

function GuessPill({ value, active }: { value: Cents; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-[7px] bg-bg px-2.5 text-footnote font-semibold shadow-float",
        active ? "text-text" : "text-text-2",
      )}
    >
      {formatCents(value)}
    </span>
  );
}

export function NoticesVisual() {
  const [first, second] = flaggedLine.guesses;
  return (
    <div className="grid gap-3">
      <SurfaceCard className="px-5 pt-2 pb-3">
        <div className="flex items-center justify-between pt-2 pb-2.5">
          <span className="font-semibold">Review</span>
          <Chip tint="amber" size="sm" dot>
            1 to check
          </Chip>
        </div>
        {categorisedLines.map((line) => (
          <MockRow key={line.name}>
            <span className="grid min-w-0 justify-items-start">
              <span className="font-medium">{line.name}</span>
              <Chip tint={line.category.tint} size="xs" className="mt-1">
                {line.category.label}
              </Chip>
            </span>
            <span className="font-medium">{formatCents(line.price)}</span>
          </MockRow>
        ))}
        <div
          data-tint="amber"
          className="-mx-2.5 my-1 grid min-h-12.5 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] bg-tint-bg px-2.5 py-2 text-small"
        >
          <span className="grid min-w-0">
            <span className="font-medium">{flaggedLine.name}</span>
            <span className="text-caption text-tint">
              Blurry — {formatCents(first)} or {formatCents(second)}?
            </span>
          </span>
          <span className="inline-flex gap-1">
            {flaggedLine.guesses.map((g) => (
              <GuessPill key={g} value={g} active={g === flaggedLine.chosen} />
            ))}
          </span>
        </div>
      </SurfaceCard>

      <div className="flex h-13 items-center gap-3 rounded-tile bg-bg pr-2 pl-3 text-small font-medium shadow-float">
        <span data-tint="blue" className="grid size-7 shrink-0 place-items-center rounded-sm bg-tint-bg text-tint">
          <Icon name="copy" size={16} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">Looks like the Lupa receipt from Tuesday</span>
        <span className="inline-flex h-9 items-center px-3 font-semibold whitespace-nowrap text-brand">Keep both</span>
      </div>

      <SurfaceCard className="grid gap-2 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-small font-semibold">
            {balanceExplanation.title} {formatCents(balanceExplanation.total)}
          </span>
          <Icon name="chevron-down" size={16} strokeWidth={2} className="text-muted" />
        </div>
        {balanceExplanation.rows.map((row) => (
          <div key={row.label} className="flex justify-between text-footnote text-text-2">
            <span>{row.label}</span>
            <span>{row.subtract ? `−${formatCents(row.amount)}` : formatCents(row.amount)}</span>
          </div>
        ))}
      </SurfaceCard>
    </div>
  );
}
