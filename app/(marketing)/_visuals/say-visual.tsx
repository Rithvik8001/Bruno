import { chunksOf } from "@/app/(flow)/bills/new/tell/_lib/phase";
import { tellCopy } from "@/app/(flow)/bills/new/tell/_data";
import { Icon } from "@/components/icons/icon";
import { Receipt } from "@/components/ui/receipt";
import { formatCents } from "@/lib/money";
import { people, sayPreview } from "../_data";
import { AvatarRow, SurfaceCard } from "../_components/primitives";

export function SayVisual() {
  const copy = tellCopy.working;
  return (
    <div className="grid gap-3">
      <SurfaceCard className="grid gap-1.5 p-4">
        <span className="text-caption font-semibold text-muted">{copy.said}</span>
        <p className="m-0 text-lead leading-7">
          {chunksOf(sayPreview.said).map((chunk) => (
            <span key={chunk.text}>
              <span className="-mx-px rounded-[5px] box-decoration-clone bg-green-bg px-0.75 py-0.5 text-green">{chunk.text}</span>
              {chunk.separator}
            </span>
          ))}
        </p>
      </SurfaceCard>
      <Receipt bodyClassName="px-5 pt-3.5 pb-4">
        <div className="mb-2 flex min-h-7 items-center justify-between gap-3">
          <span className="font-semibold">{sayPreview.title}</span>
          <span
            data-tint="green"
            className="inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-[7px] bg-tint-bg pr-2.25 pl-1.75 text-caption text-tint"
          >
            <Icon name="sparkle" size={12} />
            {copy.chip.ready}
          </span>
        </div>
        {sayPreview.lines.map((line) => (
          <div key={line.name} className="flex min-h-11 items-center justify-between gap-3 border-t border-line">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-small font-medium">{line.name}</span>
              <AvatarRow people={line.by.map((id) => people[id])} className="shrink-0" />
            </span>
            <span className="shrink-0 text-small font-semibold whitespace-nowrap">{formatCents(line.price)}</span>
          </div>
        ))}
        <div className="mt-1 flex min-h-11 items-center justify-between border-t border-border">
          <span className="font-semibold">{copy.total}</span>
          <span className="text-lead font-semibold">{formatCents(sayPreview.total)}</span>
        </div>
      </Receipt>
    </div>
  );
}
