import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { AmountChip } from "@/components/ui/chip";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { routes } from "@/lib/auth/rules";
import type { GroupSummary } from "@/lib/groups/queries";
import { groupsCopy } from "../_data";
import { balanceCaption, groupMeta } from "../_lib/summary";

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <Link
      href={routes.group(group.id)}
      className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card bg-surface p-4 text-text no-underline transition-colors hover:bg-surface-2 hover:text-text"
    >
      <GroupArtTile name={group.name} art={group.art} tint={group.tint} size="md" />
      <span className="grid min-w-0 gap-1.5">
        <span className="truncate font-semibold">{group.name}</span>
        <span className="flex min-w-0 items-center gap-2.5">
          <AvatarStack
            people={group.members.map((m) => ({ id: m.id, name: m.displayName, tint: m.tint, buddy: m.buddy }))}
            size="sm"
            max={group.memberCount > 4 ? 3 : 4}
          />
          <span className="truncate text-footnote text-text-2">{groupMeta(group)}</span>
        </span>
      </span>
      <span className="grid justify-items-end gap-1">
        <AmountChip amount={group.yourBalance} settledLabel={groupsCopy.card.settled} className="h-7 text-footnote" />
        <span className="text-caption font-normal whitespace-nowrap text-muted">{balanceCaption(group.yourBalance)}</span>
      </span>
    </Link>
  );
}
