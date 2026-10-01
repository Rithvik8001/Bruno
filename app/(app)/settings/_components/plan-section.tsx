import { Chip } from "@/components/ui/chip";
import { AI_LIMITS, allowanceSpent, type Allowance } from "@/lib/ai/rules";
import { cn } from "@/lib/utils/cn";
import { settingsCopy } from "../_data";

export function PlanSection({ allowance }: { allowance: Allowance }) {
  const copy = settingsCopy.plan;
  const { plan, limit } = allowance;
  const used = Math.min(allowance.used, limit);
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  return (
    <>
      <div className="grid gap-0.5">
        <span className="flex items-center gap-2 font-semibold">
          {copy.names[plan]}
          <Chip tint={plan === "PRO" ? "brand" : "neutral"} size="xs">
            {copy.tags[plan]}
          </Chip>
        </span>
        <span className="text-footnote text-text-2">{copy.sub[plan](AI_LIMITS.PRO)}</span>
      </div>
      <div className="grid gap-1.5">
        <div className="flex justify-between gap-3 text-footnote text-text-2">
          <span>{copy.usage}</span>
          <span className="shrink-0 font-semibold whitespace-nowrap text-text tabular-nums">{copy.used(used, limit)}</span>
        </div>
        <span
          role="progressbar"
          aria-label={copy.usage}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        >
          <span
            data-tint="amber"
            className={cn("block h-full rounded-full", allowanceSpent(allowance) ? "bg-tint" : "bg-brand")}
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="text-caption font-normal text-muted">{copy.resets}</span>
      </div>
    </>
  );
}
