import { balanceTint } from "@/lib/design-system/semantics";
import type { HomeSummary } from "../_lib/summary";
import { Greeting } from "./greeting";
import { HeadlineAmount } from "./headline-amount";

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
          <HeadlineAmount amount={summary.amount} tint={balanceTint[summary.direction]} tooltip={summary.breakdown} />
        )}
      </h1>
      {summary?.others && <span className="text-footnote text-muted">{summary.others}</span>}
    </div>
  );
}
