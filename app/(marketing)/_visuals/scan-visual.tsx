import { Icon } from "@/components/icons/icon";
import { Chip } from "@/components/ui/chip";
import { Receipt } from "@/components/ui/receipt";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/money";
import { scanPreview } from "../_data";
import { SurfaceCard } from "../_components/primitives";

export function ScanVisual() {
  return (
    <div className="grid gap-3">
      <SurfaceCard className="flex items-center gap-3.5 p-5">
        <span data-tint="violet" className="grid size-11 shrink-0 place-items-center rounded-tile bg-tint-bg text-tint">
          <Icon name="upload" size={22} />
        </span>
        <span className="grid min-w-0">
          <span className="font-semibold">Upload a receipt or drop it here</span>
          <span className="text-footnote text-text-2">JPG, PNG, HEIC, WebP or PDF</span>
        </span>
      </SurfaceCard>
      <Receipt bodyClassName="px-5 pt-3 pb-4.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-small font-semibold">Lupa · 4 Sep</span>
          <Chip tint="orange" size="sm" dot>
            Reading
          </Chip>
        </div>
        {scanPreview.map((line) => (
          <div
            key={line.name}
            className="flex min-h-8.5 items-center justify-between border-t border-line text-small font-medium"
          >
            <span>{line.name}</span>
            <span>{formatCents(line.price)}</span>
          </div>
        ))}
        <div className="flex min-h-8.5 items-center justify-between border-t border-line">
          <Skeleton className="h-3 w-[38%] rounded-[4px]" />
          <Skeleton className="h-3 w-11 rounded-[4px]" />
        </div>
      </Receipt>
    </div>
  );
}
