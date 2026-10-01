import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import type { AskQuota } from "@/lib/ask/result";
import { ASK_LIMITS } from "@/lib/ask/rules";
import { routes } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";

export interface AskLimitCardProps {
  quota: AskQuota;
  backHref: string;
  backLabel: string;
}

export function AskLimitCard({ quota, backHref, backLabel }: AskLimitCardProps) {
  const copy = askCopy.limit;
  const pro = quota.plan === "PRO";
  return (
    <Rise role="status" data-tint="amber" className="grid gap-4 rounded-card bg-tint-bg p-5">
      <div className="flex items-start gap-3.5">
        <MomentTile icon="hourglass" tint="amber" size="md" className="bg-bg" />
        <span className="grid min-w-0 gap-1 text-text">
          <span className="font-semibold">{copy.title(quota.limit)}</span>
          <span className="text-small text-pretty text-text-2">{copy.body(pro, ASK_LIMITS.PRO)}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!pro && (
          <PressLink href={routes.settings} className={cn(buttonVariants({ variant: "primary", size: "md" }), "h-11 text-small")}>
            {copy.goPro}
          </PressLink>
        )}
        <PressLink href={backHref} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 text-small shadow-none")}>
          {backLabel}
        </PressLink>
      </div>
    </Rise>
  );
}
