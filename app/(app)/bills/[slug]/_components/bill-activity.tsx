import { Icon, type IconName } from "@/components/icons/icon";
import type { BillActivityRow, BillEvent } from "@/lib/bills/queries";
import { momentLabel } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import { billDetailCopy, eventTint } from "../_data";
import { nameOf } from "../_lib/view";

type ShownEvent = Exclude<BillEvent, { kind: "finalized" }>;

const eventIcon = { created: "receipt", updated: "pencil" } as const satisfies Record<ShownEvent["kind"], IconName>;

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
          <li key={row.id} className="grid min-h-11 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 text-small">
            <span
              data-tint={eventTint[row.event.kind]}
              className="grid size-7 place-items-center rounded-sm bg-tint-bg text-tint"
            >
              <Icon name={eventIcon[row.event.kind]} size={14} strokeWidth={2.2} />
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
