import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { routes } from "@/lib/auth/rules";
import { daysAgo } from "@/lib/dates";
import type { HomeNextUp } from "@/lib/home/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { homeCopy } from "../_data";
import { money } from "../_lib/summary";

interface CardContent {
  readonly href: string;
  readonly title: string;
  readonly subtitle: string;
  readonly cta: string;
}

function contentOf(nextUp: HomeNextUp, now: Date): CardContent {
  const copy = homeCopy.nextUp;
  const first = firstNameOf(nextUp.person.displayName);
  switch (nextUp.kind) {
    case "confirm":
      return {
        href: routes.settle(nextUp.groupId, nextUp.person.id, routes.app),
        title: copy.confirmTitle(first, money(nextUp.amount, nextUp.currency)),
        subtitle: copy.subtitle([copy.confirmSub], copy.age(daysAgo(nextUp.at, now))),
        cta: copy.confirmCta,
      };
    case "owe":
      return {
        href: routes.settle(nextUp.groupId, nextUp.person.id, routes.app),
        title: copy.youOwe(first, money(nextUp.amount, nextUp.currency)),
        subtitle: copy.subtitle(nextUp.titles, ""),
        cta: copy.oweCta,
      };
    case "owed":
      return {
        href: routes.bill(nextUp.bill.slug),
        title: copy.owesYou(first, money(nextUp.amount, nextUp.bill.currency)),
        subtitle: copy.subtitle(
          nextUp.titles.length > 0 ? nextUp.titles : [nextUp.bill.title],
          copy.age(daysAgo(nextUp.bill.occurredAt, now)),
        ),
        cta: copy.cta,
      };
  }
}

export function NextUpCard({ nextUp, now }: { nextUp: HomeNextUp; now: Date }) {
  const content = contentOf(nextUp, now);
  return (
    <Link
      href={content.href}
      className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface px-4.5 py-4 text-text no-underline transition-colors hover:bg-surface-2 hover:text-text"
    >
      <Avatar name={nextUp.person.displayName} tint={nextUp.person.tint} buddy={nextUp.person.buddy} size="xl" className="size-11" />
      <span className="grid min-w-0">
        <span className="font-semibold">{content.title}</span>
        <span className="truncate text-small text-text-2">{content.subtitle}</span>
      </span>
      <span className="inline-flex h-9 items-center rounded-control bg-bg px-3.5 text-small font-semibold whitespace-nowrap shadow-float">
        {content.cta}
      </span>
    </Link>
  );
}
