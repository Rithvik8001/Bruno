import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { routes } from "@/lib/auth/rules";
import { daysAgo } from "@/lib/dates";
import type { HomeNextUp } from "@/lib/home/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { homeCopy } from "../_data";
import { money } from "../_lib/summary";

export function NextUpCard({ nextUp, now }: { nextUp: HomeNextUp; now: Date }) {
  const copy = homeCopy.nextUp;
  const first = firstNameOf(nextUp.person.displayName);
  const amount = money(nextUp.amount, nextUp.bill.currency);
  const title = nextUp.amount > 0 ? copy.owesYou(first, amount) : copy.youOwe(first, amount);
  const titles = nextUp.titles.length > 0 ? nextUp.titles : [nextUp.bill.title];

  return (
    <Link
      href={routes.bill(nextUp.bill.slug)}
      className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface px-4.5 py-4 text-text no-underline transition-colors hover:bg-surface-2 hover:text-text"
    >
      <Avatar name={nextUp.person.displayName} tint={nextUp.person.tint} buddy={nextUp.person.buddy} size="xl" className="size-11" />
      <span className="grid min-w-0">
        <span className="font-semibold">{title}</span>
        <span className="truncate text-small text-text-2">
          {copy.subtitle(titles, copy.age(daysAgo(nextUp.bill.occurredAt, now)))}
        </span>
      </span>
      <span className="inline-flex h-9 items-center rounded-control bg-bg px-3.5 text-small font-semibold whitespace-nowrap shadow-float">
        {copy.cta}
      </span>
    </Link>
  );
}
