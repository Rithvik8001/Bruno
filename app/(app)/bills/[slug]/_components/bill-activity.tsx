import { Avatar } from "@/components/ui/avatar";
import { Icon3d } from "@/components/ui/icon-3d";
import type { BillActivityRow, BillEvent } from "@/lib/bills/queries";
import { momentLabel } from "@/lib/dates";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PersonId } from "@/lib/domain/ids";
import { billDetailCopy } from "../_data";
import { nameOf } from "../_lib/view";

type ShownEvent = Exclude<BillEvent, { kind: "finalized" }>;

const eventMoment = { created: "receipt", updated: "memo" } as const satisfies Record<ShownEvent["kind"], MomentIconId>;

const BADGE_PX = 22;

function describe(event: ShownEvent): string {
  const copy = billDetailCopy.activity;
  switch (event.kind) {
    case "created":
      return copy.created(event.itemCount);
    case "updated":
      return copy.updated(event.fields);
  }
}

const shown = (row: BillActivityRow): row is BillActivityRow & { event: ShownEvent } =>
  row.event.kind !== "finalized" && !(row.event.kind === "updated" && row.event.fields.length === 0);

export function BillActivity({ rows, you, now }: { rows: readonly BillActivityRow[]; you: PersonId; now: Date }) {
  const events = rows.filter(shown);
  if (events.length === 0) return null;
  const copy = billDetailCopy.activity;
  return (
    <section className="grid gap-2">
      <h2 className="m-0 text-body font-semibold">{copy.title}</h2>
      <ul className="m-0 grid list-none p-0">
        {events.map((row) => (
          <li key={row.id} className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 text-small">
            <span className="relative size-10">
              {row.actor ? (
                <Avatar name={row.actor.displayName} tint={row.actor.tint} buddy={row.actor.buddy} size="xl" />
              ) : (
                <span className="block size-10 rounded-full bg-surface-2" />
              )}
              <span className="absolute -right-3 -bottom-1.5 grid size-6 place-items-center rounded-full bg-bg shadow-[0_0_0_2px_var(--bg),0_1px_3px_rgba(26,25,23,0.12)]">
                <Icon3d icon={eventMoment[row.event.kind]} size={BADGE_PX} />
              </span>
            </span>
            <span className="truncate text-text-2">
              <span className="font-medium text-text">{row.actor ? nameOf(row.actor, you) : copy.someone}</span>{" "}
              {describe(row.event)}
            </span>
            <span className="text-caption font-normal whitespace-nowrap text-muted">{momentLabel(row.at, now)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
