import { BillRow } from "@/components/patterns/bill-row";
import { routes } from "@/lib/auth/rules";
import type { BillSummary } from "@/lib/bills/queries";
import { formatMoney } from "@/lib/currency";
import { shortDay } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import { firstNameOf } from "@/lib/people/defaults";
import { groupDetailCopy } from "../_data";

export function BillsSection({ bills, you, now }: { bills: readonly BillSummary[]; you: PersonId; now: Date }) {
  const copy = groupDetailCopy;
  return (
    <ul aria-label={copy.billList.label} className="m-0 grid list-none gap-2.5 p-0">
      {bills.map((bill) => (
        <li key={bill.id}>
          <BillRow
            href={routes.bill(bill.slug)}
            title={bill.title}
            status={bill.status}
            meta={copy.billList.paidBy(bill.payer.id === you ? copy.youName.toLowerCase() : firstNameOf(bill.payer.displayName))}
            total={formatMoney(bill.total, bill.currency)}
            when={shortDay(bill.occurredAt, now)}
          />
        </li>
      ))}
    </ul>
  );
}
