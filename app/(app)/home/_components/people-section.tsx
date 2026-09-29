import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar } from "@/components/ui/avatar";
import { AmountChip } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { routes } from "@/lib/auth/rules";
import type { HomePersonBalance } from "@/lib/home/queries";
import { cents } from "@/lib/money";
import { homeCopy } from "../_data";
import { personCaption } from "../_lib/summary";
import { SectionHeader } from "./section-header";

export interface PeopleSectionProps {
  people: readonly HomePersonBalance[];
  meta: string;
}

function Balances({ row }: { row: HomePersonBalance }) {
  const entries = [...row.balances];
  if (entries.length === 0) return <AmountChip amount={cents(0)} settledLabel={homeCopy.people.allSquare} />;
  return (
    <span className="grid justify-items-end gap-1">
      {entries.map(([currency, amount]) => (
        <AmountChip key={currency} amount={amount} currency={currency} settledLabel={homeCopy.people.allSquare} />
      ))}
    </span>
  );
}

export function PeopleSection({ people, meta }: PeopleSectionProps) {
  return (
    <section className="grid gap-2">
      <SectionHeader
        title={homeCopy.people.title}
        aside={meta ? <span className="text-footnote font-medium text-muted">{meta}</span> : undefined}
      />
      <Stagger className="grid">
        {people.map((row) => (
          <StaggerItem key={row.person.id}>
            <ListRow
              href={
                row.groupId
                  ? row.balances.size > 0
                    ? routes.settle(row.groupId, row.person.id, routes.app)
                    : `${routes.group(row.groupId)}?tab=balances`
                  : routes.groups
              }
              leading={<Avatar name={row.person.displayName} tint={row.person.tint} buddy={row.person.buddy} size="xl" />}
              title={row.person.displayName}
              caption={personCaption(row)}
              trailing={<Balances row={row} />}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
