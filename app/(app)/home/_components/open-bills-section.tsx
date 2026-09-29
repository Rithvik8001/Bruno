import { PressLink } from "@/components/motion/motion-link";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { BillRow } from "@/components/patterns/bill-row";
import { routes } from "@/lib/auth/rules";
import type { BillSummary } from "@/lib/bills/queries";
import { formatMoney } from "@/lib/currency";
import { shortDay } from "@/lib/dates";
import { homeCopy } from "../_data";
import { money } from "../_lib/summary";
import { SectionHeader } from "./section-header";

function metaOf(bill: BillSummary): string {
  const copy = homeCopy.bills;
  return bill.yourBalance > 0 ? copy.owedToYou(bill.owingCount) : copy.youOwe(money(bill.yourBalance, bill.currency));
}

export function OpenBillsSection({ bills, now }: { bills: readonly BillSummary[]; now: Date }) {
  return (
    <section className="grid gap-2">
      <SectionHeader
        title={homeCopy.bills.title}
        aside={
          <PressLink href={routes.activity} className="inline-block text-footnote font-semibold">
            {homeCopy.bills.allActivity}
          </PressLink>
        }
      />
      <Stagger as="ul" className="m-0 grid list-none gap-2.5 p-0">
        {bills.map((bill) => (
          <StaggerItem as="li" key={bill.id}>
            <BillRow
              href={routes.bill(bill.slug)}
              title={bill.title}
              group={bill.group}
              status={bill.status}
              meta={metaOf(bill)}
              total={formatMoney(bill.total, bill.currency)}
              when={shortDay(bill.occurredAt, now)}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
