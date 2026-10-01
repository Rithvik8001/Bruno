import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { AI_LIMITS, type Allowance } from "@/lib/ai/rules";
import { newBillCopy } from "../_data";

export function QuotaBanner({ quota }: { quota: Allowance }) {
  const copy = newBillCopy.scan.limit;
  return (
    <Rise role="status" data-tint="amber" className="flex items-center gap-3 rounded-tile bg-tint-bg px-4 py-3.5 text-small text-tint">
      <Icon name="clock" size={18} strokeWidth={2} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{copy.title(quota.limit)}</span> {copy.body(quota.plan === "PRO", AI_LIMITS.PRO)}
      </span>
    </Rise>
  );
}
