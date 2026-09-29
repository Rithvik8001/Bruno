import { AvatarStack } from "@/components/ui/avatar";
import { GroupArtTile } from "@/components/ui/icon-3d";
import type { GroupInvite } from "@/lib/groups/queries";
import { joinCopy } from "../_data";

export function JoinCard({ invite }: { invite: GroupInvite }) {
  return (
    <div data-tint={invite.tint} className="flex items-center gap-3.5 rounded-card bg-tint-bg p-4 text-tint">
      <GroupArtTile name={invite.name} art={invite.art} tint={invite.tint} size="md" className="bg-bg" />
      <span className="grid min-w-0 flex-1">
        <span className="truncate font-semibold">{invite.name}</span>
        <span className="truncate text-footnote">{joinCopy.invited(invite.invitedBy, invite.memberCount)}</span>
      </span>
      <AvatarStack
        people={invite.members.map((m) => ({ id: m.id, name: m.displayName, tint: m.tint, buddy: m.buddy }))}
        size="md"
        max={3}
      />
    </div>
  );
}
