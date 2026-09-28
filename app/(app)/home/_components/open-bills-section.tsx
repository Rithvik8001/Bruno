import Link from "next/link";
import { StatusChip, Tag } from "@/components/ui/chip";
import { routes } from "@/lib/auth/rules";
import { groupArtFor } from "@/lib/design-system/icons3d";
import { homeCopy, type HomeBill } from "../_data";
import { money } from "../_lib/summary";
import { SectionHeader } from "./section-header";

export function OpenBillsSection({ bills }: { bills: readonly HomeBill[] }) {
  return (
    <section className="grid gap-2">
      <SectionHeader
        title={homeCopy.bills.title}
        aside={
          <Link href={routes.activity} className="text-footnote font-semibold">
            {homeCopy.bills.allActivity}
          </Link>
        }
      />
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {bills.map((bill) => (
          <li key={bill.id}>
            <Link
              href={routes.activity}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-text no-underline transition-colors hover:bg-surface-2 hover:text-text"
            >
              <span className="grid min-w-0 gap-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold">{bill.name}</span>
                  <Tag tint={bill.group.tint} art={groupArtFor(bill.group.name)}>
                    {bill.group.name}
                  </Tag>
                </span>
                <span className="flex min-w-0 items-center gap-2 text-footnote text-text-2">
                  <StatusChip status={bill.status} size="sm" />
                  <span className="truncate">{bill.meta}</span>
                </span>
              </span>
              <span className="grid justify-items-end gap-0.5">
                <span className="font-semibold">{money(bill.total)}</span>
                <span className="text-caption font-normal text-muted">{bill.when}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
