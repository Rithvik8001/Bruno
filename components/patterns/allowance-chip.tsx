import { Icon } from "@/components/icons/icon";
import { Chip } from "@/components/ui/chip";
import { allowanceCopy } from "@/lib/ai/messages";
import { ALLOWANCE_LOW, allowanceSpent, type Allowance } from "@/lib/ai/rules";
import { cn } from "@/lib/utils/cn";

export interface AllowanceChipProps {
  quota: Allowance;
  look: "dot" | "sparkle";
}

export function AllowanceChip({ quota, look }: AllowanceChipProps) {
  const copy = allowanceCopy;
  const out = allowanceSpent(quota);
  const long = out ? copy.none : copy.left(quota.left, quota.limit);
  if (look === "dot") {
    return (
      <Chip tint={out ? "amber" : "neutral"} size="sm" dot role="status" className="min-w-0 max-w-full">
        <span className="truncate">{long}</span>
      </Chip>
    );
  }
  const low = out || quota.left <= ALLOWANCE_LOW;
  return (
    <span
      role="status"
      data-tint={low ? "amber" : undefined}
      className={cn(
        "inline-flex h-7 min-w-0 items-center gap-1.5 rounded-sm pr-2.5 pl-2 text-footnote font-semibold whitespace-nowrap",
        low ? "bg-tint-bg text-tint" : "bg-surface text-text-2",
      )}
    >
      <Icon name="sparkle" size={12} className="shrink-0" />
      <span className="max-[400px]:hidden">{long}</span>
      <span className="min-[401px]:hidden">{out ? copy.noneShort : copy.leftShort(quota.left, quota.limit)}</span>
    </span>
  );
}
