import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "../_data";

export function QuotaBanner({ limit }: { limit: number }) {
  const copy = newBillCopy.scan.quota;
  return (
    <Rise
      role="status"
      data-tint="amber"
      className="flex items-center gap-3 rounded-tile bg-tint-bg py-3.5 pr-2.5 pl-4 text-small text-tint"
    >
      <Icon name="clock" size={18} strokeWidth={2} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">{copy.banner(limit)}</span> {copy.bannerBody}
      </span>
      <PressLink href={routes.settings} className={cn(buttonVariants({ variant: "elevated", size: "sm" }), "shrink-0 text-footnote")}>
        {copy.goPro}
      </PressLink>
    </Rise>
  );
}
