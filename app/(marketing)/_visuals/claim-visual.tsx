import { Icon } from "@/components/icons/icon";
import { CheckIndicator } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { formatCents } from "@/lib/money";
import { CLAIM_PREVIEW_COUNT, lupaLines, people } from "../_data";
import { AvatarRow, MockRow, SurfaceCard } from "../_components/primitives";

export function ClaimVisual() {
  return (
    <div className="grid gap-3">
      <SurfaceCard className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate text-small text-text-2">bruno.app/j/lupa-tonight</span>
        <span
          data-tint="green"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-bg px-3 text-footnote font-semibold text-tint shadow-float"
        >
          <Icon name="check" size={14} strokeWidth={2.4} />
          Copied
        </span>
      </SurfaceCard>
      <SurfaceCard className="px-5 pt-2 pb-3">
        <div className="flex items-center justify-between pt-2 pb-2.5">
          <span className="font-semibold">Who had what?</span>
          <Chip tint="orange" size="sm" dot>
            {CLAIM_PREVIEW_COUNT} of {lupaLines.length} claimed
          </Chip>
        </div>
        {lupaLines.map((line, i) => {
          const claimed = i < CLAIM_PREVIEW_COUNT;
          return (
            <MockRow key={line.name}>
              <span className="flex min-w-0 items-center gap-3">
                <CheckIndicator checked={claimed} />
                <span className="truncate font-medium">{line.name}</span>
              </span>
              <span className="flex items-center gap-2.5">
                {claimed && <AvatarRow people={line.by.map((id) => people[id])} />}
                <span className="min-w-11 text-right font-medium">{formatCents(line.price)}</span>
              </span>
            </MockRow>
          );
        })}
      </SurfaceCard>
    </div>
  );
}
