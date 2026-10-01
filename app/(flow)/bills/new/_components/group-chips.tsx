import { PressLink } from "@/components/motion/motion-link";
import { routes } from "@/lib/auth/rules";
import type { GroupSummary } from "@/lib/groups/queries";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "../_data";

export interface GroupChipsProps {
  groups: readonly GroupSummary[];
  selectedId: string;
  hrefFor?: (groupId: string) => string;
}

export function GroupChips({ groups, selectedId, hrefFor = routes.newBillFor }: GroupChipsProps) {
  const copy = newBillCopy.entry;
  return (
    <nav aria-label={copy.groupsLabel} className="flex flex-wrap items-center gap-2">
      <span className="mr-0.5 text-footnote font-medium text-text-2">{copy.forLabel}</span>
      {groups.map((group) => {
        const selected = group.id === selectedId;
        return (
          <PressLink
            key={group.id}
            href={hrefFor(group.id)}
            replace
            scroll={false}
            aria-current={selected ? "true" : undefined}
            data-tint={selected ? group.tint : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-control border pr-3 pl-2.25 text-footnote font-semibold no-underline",
              "transition-[background-color,border-color,color] duration-150 ease-standard",
              selected
                ? "border-transparent bg-tint-bg text-tint hover:text-tint"
                : "border-line bg-transparent text-text-2 hover:bg-surface hover:text-text",
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {group.name}
          </PressLink>
        );
      })}
    </nav>
  );
}
