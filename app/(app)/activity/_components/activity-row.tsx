import { PressLink } from "@/components/motion/motion-link";
import { AmountChip, Tag } from "@/components/ui/chip";
import { MomentTile } from "@/components/ui/icon-3d";
import { clockTime } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import type { FeedItem } from "@/lib/feed/types";
import { cn } from "@/lib/utils/cn";
import { amountDirection, feedLine } from "../_lib/view";

const rowClass =
  "-mx-3 grid min-h-15 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-control px-3 text-text no-underline";

export function ActivityRow({ item, you }: { item: FeedItem; you: PersonId }) {
  const line = feedLine(item, you);
  const body = (
    <>
      <MomentTile icon={item.moment} tint={item.tint} size="sm" />
      <span className="grid min-w-0">
        <span className="truncate text-small">
          <span className="font-semibold">{line.who}</span> {line.what}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-footnote text-text-2">
          <Tag tint={item.group.tint} art={item.group.art ?? undefined}>
            {item.group.name}
          </Tag>
          <span className="whitespace-nowrap">{clockTime(item.at)}</span>
        </span>
      </span>
      {item.amount ? (
        <AmountChip amount={item.amount.cents} currency={item.amount.currency} direction={amountDirection[item.amount.sign]} className="h-7 px-2.25 text-footnote" />
      ) : (
        <span />
      )}
    </>
  );
  if (!item.href) return <div className={rowClass}>{body}</div>;
  return (
    <PressLink
      wide
      href={item.href}
      className={cn(rowClass, "transition-colors duration-150 ease-standard hover:bg-surface hover:text-text")}
    >
      {body}
    </PressLink>
  );
}
