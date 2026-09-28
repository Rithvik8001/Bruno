import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils/cn";
import { plans, pricingContent, routes, SECTION_IDS, type Plan } from "../_data";
import { SectionHeading, SectionLead, SurfaceCard } from "../_components/primitives";

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <SurfaceCard className="grid grid-rows-[auto_auto_1fr_auto] gap-5.5 px-6 py-7">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="text-[1.0625rem] font-semibold">{plan.name}</span>
          {plan.badge && (
            <Chip tint="brand" size="xs" className="h-6 rounded-[7px] px-2 text-caption">
              {plan.badge}
            </Chip>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[2.5rem] leading-11 font-semibold tracking-[-0.025em]">{plan.price}</span>
          <span className="text-small text-text-2">{plan.period}</span>
        </div>
      </div>
      <Link
        href={routes.signUp}
        className={cn(buttonVariants({ variant: plan.cta.variant, size: "md", fullWidth: true }), "h-11 text-small")}
      >
        {plan.cta.label}
      </Link>
      <ul className="m-0 grid list-none content-start gap-2.5 p-0 text-small">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5">
            <Icon
              name="check"
              size={18}
              strokeWidth={2.2}
              className={cn("mt-px shrink-0", f.highlight ? "text-brand" : "text-muted")}
            />
            <span className={f.highlight ? "font-semibold" : undefined}>{f.label}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 border-t border-line pt-4 text-footnote text-text-2">{plan.footnote}</p>
    </SurfaceCard>
  );
}

export function Pricing() {
  return (
    <section
      id={SECTION_IDS.pricing}
      aria-labelledby="pricing-title"
      className="flex scroll-mt-16 flex-wrap items-start gap-x-16 gap-y-10 border-t border-line py-24"
    >
      <div className="max-w-80 grow basis-60 min-[720px]:sticky min-[720px]:top-24">
        <Chip tint="amber" icon="wallet" size="sm" className="mb-5">
          {pricingContent.label}
        </Chip>
        <SectionHeading id="pricing-title" className="mb-3.5">
          {pricingContent.title}
        </SectionHeading>
        <SectionLead>{pricingContent.body}</SectionLead>
      </div>
      <div className="grid min-w-0 grow-2 basis-100 grid-cols-[repeat(auto-fit,minmax(min(16.25rem,100%),1fr))] gap-4">
        {plans.map((p) => (
          <PlanCard key={p.name} plan={p} />
        ))}
      </div>
    </section>
  );
}
