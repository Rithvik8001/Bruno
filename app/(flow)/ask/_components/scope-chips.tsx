import { PressLink } from "@/components/motion/motion-link";
import type { AskScopeGroup } from "@/lib/ask/queries";
import { routes } from "@/lib/auth/rules";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";

export interface ScopeChipsProps {
  groups: readonly AskScopeGroup[];
  selectedId: string | null;
}

interface ScopeOption {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly tint: Tint;
  readonly selected: boolean;
}

export function ScopeChips({ groups, selectedId }: ScopeChipsProps) {
  const copy = askCopy.scope;
  const options: ScopeOption[] = [
    { key: "all", label: copy.all, href: routes.askAbout(), tint: "violet", selected: selectedId === null },
    ...groups.map((group) => ({ key: group.id, label: group.name, href: routes.askAbout(group.id), tint: group.tint, selected: group.id === selectedId })),
  ];
  return (
    <nav aria-label={copy.nav} className="flex flex-wrap items-center gap-2">
      <span className="mr-0.5 text-footnote font-medium text-text-2">{copy.label}</span>
      {options.map((option) => (
        <PressLink
          key={option.key}
          href={option.href}
          replace
          scroll={false}
          aria-current={option.selected ? "true" : undefined}
          data-tint={option.selected ? option.tint : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-control border pr-3 pl-2.25 text-footnote font-semibold no-underline pointer-coarse:h-11",
            "transition-[background-color,border-color,color] duration-150 ease-standard",
            option.selected ? "border-transparent bg-tint-bg text-tint hover:text-tint" : "border-line bg-transparent text-text-2 hover:bg-surface hover:text-text",
          )}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {option.label}
        </PressLink>
      ))}
    </nav>
  );
}
