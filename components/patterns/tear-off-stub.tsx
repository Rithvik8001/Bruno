import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface TearOffStubProps {
  title: string;
  amount: Cents;
  settled: boolean;
  onSettle: () => void;
  onUndo: () => void;
  actionLabel?: string;
  confirmation?: string;
}

export function TearOffStub({
  title,
  amount,
  settled,
  onSettle,
  onUndo,
  actionLabel = "Mark as paid",
  confirmation = "Settled",
}: TearOffStubProps) {
  return (
    <div className="relative min-h-47.5 w-full max-w-75">
      <div className="flex items-center justify-between rounded-t-card bg-surface p-4">
        <span className="font-semibold">{title}</span>
        <span className="text-title">${formatCents(amount)}</span>
      </div>
      <div aria-hidden className="mx-3 border-t-2 border-dashed border-border" />
      <div
        inert={settled}
        className={cn(
          "origin-top-left rounded-b-card px-4 pt-3.5 pb-4 transition-[transform,opacity,background-color,box-shadow]",
          "duration-[520ms,420ms,220ms,220ms] ease-standard",
          settled ? "translate-x-4.5 translate-y-14 -rotate-6 bg-bg opacity-0 shadow-float delay-[0ms,120ms,0ms,0ms]" : "bg-surface",
        )}
      >
        <Button fullWidth size="md" className="h-11" onClick={onSettle}>
          {actionLabel}
        </Button>
      </div>
      {settled && (
        <div
          role="status"
          className="absolute inset-x-0 top-20.5 flex animate-rise items-center gap-2.5 px-4 py-3.5 [animation-delay:360ms]"
        >
          <span data-tint="green" className="grid size-8 place-items-center rounded-control bg-tint-bg text-tint">
            <Icon name="check" size={18} strokeWidth={2.4} />
          </span>
          <span className="flex-1 font-semibold">{confirmation}</span>
          <Button variant="secondary" size="sm" className="font-semibold" onClick={onUndo}>
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
