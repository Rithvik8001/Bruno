import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { buttonVariants } from "@/components/ui/button-variants";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { balanceTint } from "@/lib/design-system/semantics";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { MemberBalance } from "@/lib/groups/queries";
import type { Payment } from "@/lib/ledger/settle-up";
import { cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { routes } from "@/lib/auth/rules";
import type { SettlementCard } from "@/lib/settlements/rows";
import { cn } from "@/lib/utils/cn";
import { groupDetailCopy } from "../_data";
import { PaymentsList } from "./payments-list";

export interface BalancesSectionProps {
  groupId: string;
  balances: readonly MemberBalance[];
  payments: readonly Payment[];
  settlements: readonly SettlementCard[];
  currency: CurrencyCode;
  you: PersonId;
}

export function BalancesSection({ groupId, balances, payments, settlements, currency, you }: BalancesSectionProps) {
  const copy = groupDetailCopy.balanceList;
  const back = `${routes.group(groupId)}?tab=balances`;
  const mine = payments.find((p) => p.from === you || p.to === you);
  const toConfirm = settlements.filter((s) => s.actions.confirm);
  const people = new Map<PersonId, PersonView>(balances.map((b) => [b.person.id, b.person]));
  const nameOf = (id: PersonId) => (id === you ? groupDetailCopy.youName : firstNameOf(people.get(id)?.displayName ?? ""));
  const signed = (value: number) =>
    value === 0 ? formatMoney(cents(0), currency) : `${value > 0 ? "+" : "−"}${formatMoney(cents(Math.abs(value)), currency)}`;

  return (
    <div className="grid gap-6">
      {toConfirm.map((s) => (
        <div key={s.id} data-tint="blue" className="flex items-center gap-3 rounded-tile bg-tint-bg py-3 pr-2 pl-3.5 text-small text-tint">
          <Icon name="clock" size={18} strokeWidth={2} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{copy.pendingTitle(firstNameOf(s.from.displayName), formatMoney(s.amount, s.currency))}</span>{" "}
            {copy.pendingBody}
          </span>
          <PressLink
            href={routes.settle(groupId, s.from.id, back)}
            className="inline-flex h-8 shrink-0 items-center rounded-sm bg-bg px-2.5 text-footnote font-semibold whitespace-nowrap text-text no-underline hover:text-text"
          >
            {copy.pendingCta}
          </PressLink>
        </div>
      ))}
      <Stagger as="ul" aria-label={copy.label} className="m-0 grid list-none p-0 [&>li+li]:border-t [&>li+li]:border-line">
        {balances.map((row) => {
          const direction = row.net > 0 ? "owed" : row.net < 0 ? "owes" : "settled";
          const caption =
            direction === "owes" ? copy.owes(row.openTitles) : direction === "owed" ? copy.owed(row.paid, row.involved) : copy.square;
          return (
            <StaggerItem as="li" key={row.person.id} className="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
              <Avatar name={row.person.displayName} tint={row.person.tint} buddy={row.person.buddy} size="xl" />
              <span className="grid min-w-0">
                <span className="truncate font-medium">
                  {row.person.id === you ? groupDetailCopy.youName : row.person.displayName}
                </span>
                <span className="truncate text-small text-text-2">{caption}</span>
              </span>
              <Chip tint={balanceTint[direction]} size="sm" className="h-7.5 px-2.5 text-small">
                {signed(row.net)}
              </Chip>
            </StaggerItem>
          );
        })}
      </Stagger>
      {payments.length > 0 && (
        <section className="grid gap-3.5 rounded-card bg-surface px-5 py-4.5">
          <div className="flex items-center justify-between gap-3">
            <span className="grid gap-0.5">
              <span className="font-semibold">{copy.settleTitle}</span>
              <span className="text-footnote text-text-2">{copy.settleBody(payments.length)}</span>
            </span>
            <Chip tint="green" size="sm" dot>
              {copy.payments(payments.length)}
            </Chip>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0">
            {payments.map((payment) => {
              const from = people.get(payment.from);
              const to = people.get(payment.to);
              return (
                <li key={`${payment.from}-${payment.to}`} className="flex items-center gap-3 rounded-control bg-bg px-3.5 py-3">
                  {from && <Avatar name={from.displayName} tint={from.tint} buddy={from.buddy} size="md" />}
                  <Icon name="arrow-right" size={18} className="text-muted" />
                  {to && <Avatar name={to.displayName} tint={to.tint} buddy={to.buddy} size="md" />}
                  <span className="min-w-0 flex-1 truncate text-small">{copy.pays(nameOf(payment.from), nameOf(payment.to))}</span>
                  <span className="font-semibold">{formatMoney(payment.amount, currency)}</span>
                </li>
              );
            })}
          </ul>
          {mine && (
            <PressLink
              wide
              href={routes.settle(groupId, mine.from === you ? mine.to : mine.from, back)}
              className={cn(buttonVariants({ size: "md" }), "h-11 text-small font-semibold")}
            >
              {copy.settleUp}
            </PressLink>
          )}
        </section>
      )}
      {settlements.length > 0 && <PaymentsList settlements={settlements} you={you} />}
    </div>
  );
}
