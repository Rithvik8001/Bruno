import { Chip } from "@/components/ui/chip";
import { formatCents } from "@/lib/money";
import { foreignExpenses, groups, groupsContent } from "../_data";
import { AvatarRow, FeaturePills, SectionHeading, SectionLead, SurfaceCard } from "../_components/primitives";

export function Groups() {
  return (
    <section aria-labelledby="groups-title" className="border-t border-line py-24">
      <div className="mb-10 max-w-140">
        <SectionHeading id="groups-title" className="mb-3.5">
          {groupsContent.title}
        </SectionHeading>
        <SectionLead>{groupsContent.body}</SectionLead>
        <FeaturePills features={groupsContent.features} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(17.5rem,100%),1fr))] gap-4">
        <SurfaceCard className="p-5">
          <div className="mb-3.5 font-semibold">Groups</div>
          {groups.map((g) => (
            <div key={g.name} className="flex min-h-14 items-center justify-between gap-3 border-t border-line">
              <Chip tint={g.tint} size="sm" dot>
                {g.name}
              </Chip>
              <span className="flex items-center gap-3">
                <AvatarRow people={g.members} />
                <span className="text-footnote font-medium whitespace-nowrap text-text-2">{g.meta}</span>
              </span>
            </div>
          ))}
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <div className="mb-3.5 font-semibold">Multi-currency</div>
          {foreignExpenses.map((f) => (
            <div key={f.name} className="flex min-h-14 items-center justify-between gap-3 border-t border-line">
              <span className="grid min-w-0">
                <span className="text-small font-medium">{f.name}</span>
                <span className="text-footnote text-text-2">{f.local}</span>
              </span>
              <span className="inline-flex h-7.5 items-center rounded-sm bg-surface-2 px-2.5 text-small font-semibold whitespace-nowrap">
                ${formatCents(f.home)}
              </span>
            </div>
          ))}
        </SurfaceCard>
      </div>
    </section>
  );
}
