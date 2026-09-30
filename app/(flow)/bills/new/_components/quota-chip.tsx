import { Chip } from "@/components/ui/chip";
import type { ScanQuota } from "@/lib/scans/quota";
import { newBillCopy } from "../_data";

export function QuotaChip({ quota }: { quota: ScanQuota }) {
  const copy = newBillCopy.scan.quota;
  const out = quota.left <= 0;
  return (
    <Chip tint={out ? "amber" : "neutral"} size="sm" dot role="status">
      {out ? copy.none : copy.left(quota.left, quota.limit)}
    </Chip>
  );
}
