import { Icon } from "@/components/icons/icon";
import type { AskQuota } from "@/lib/ask/result";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";

const LOW = 2;

export function AskQuotaChip({ quota }: { quota: AskQuota }) {
  const copy = askCopy.quota;
  const out = quota.left <= 0;
  const low = out || quota.left <= LOW;
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
      <span className="max-[400px]:hidden">{out ? copy.none : copy.left(quota.left, quota.limit)}</span>
      <span className="min-[401px]:hidden">{out ? copy.noneShort : copy.leftShort(quota.left, quota.limit)}</span>
    </span>
  );
}
