import { Avatar } from "@/components/ui/avatar";
import { AmountChip } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { routes } from "@/lib/auth/rules";
import { homeCopy, type HomePerson } from "../_data";
import { SectionHeader } from "./section-header";

export interface PeopleSectionProps {
  people: readonly HomePerson[];
  meta: string;
}

export function PeopleSection({ people, meta }: PeopleSectionProps) {
  return (
    <section className="grid gap-2">
      <SectionHeader
        title={homeCopy.people.title}
        aside={<span className="text-footnote font-medium text-muted">{meta}</span>}
      />
      <div className="grid">
        {people.map((p) => (
          <ListRow
            key={p.id}
            href={routes.activity}
            leading={<Avatar name={p.name} tint={p.tint} buddy={p.buddy} size="xl" />}
            title={p.name}
            caption={p.caption}
            trailing={<AmountChip amount={p.balance} settledLabel={homeCopy.people.allSquare} />}
          />
        ))}
      </div>
    </section>
  );
}
