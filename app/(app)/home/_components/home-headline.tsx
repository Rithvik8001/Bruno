import { RollingNumber } from "@/components/ui/rolling-number";
import { balanceTint } from "@/lib/design-system/semantics";
import type { HomeSummary } from "../_lib/summary";
import { Greeting } from "./greeting";

export interface HomeHeadlineProps {
  firstName: string;
  headline: string;
  summary?: HomeSummary;
}

export function HomeHeadline({ firstName, headline, summary }: HomeHeadlineProps) {
  const showAmount = summary !== undefined && summary.direction !== "settled";
  return (
    <div className="grid gap-0.5">
      <Greeting firstName={firstName} />
      <h1 className="m-0 text-heading">
        {headline}
        {showAmount && (
          <span
            data-tint={balanceTint[summary.direction]}
            title={summary.breakdown}
            className="ml-2 -mr-1.5 inline-block cursor-default rounded-xs bg-[linear-gradient(var(--tint-bg),var(--tint-bg))] bg-size-[100%_42%] bg-position-[0_88%] bg-no-repeat px-1.5 text-tint transition-[background-size] duration-200 ease-spring hover:bg-size-[100%_100%]"
          >
            <RollingNumber value={summary.amount} />
          </span>
        )}
      </h1>
      {summary?.others && <span className="text-footnote text-muted">{summary.others}</span>}
    </div>
  );
}
