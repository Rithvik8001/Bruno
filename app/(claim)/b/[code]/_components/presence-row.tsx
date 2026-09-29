"use client";

import { AvatarStack } from "@/components/ui/avatar-stack";
import { firstNameOf } from "@/lib/people/defaults";
import { liveClaimCopy } from "../_data";
import type { PresentPerson } from "../_lib/use-live-channel";

export interface PresenceRowProps {
  people: readonly PresentPerson[];
  me: PresentPerson | null;
  online: boolean;
}

const ANONYMOUS = "anonymous";

export function PresenceRow({ people, me, online }: PresenceRowProps) {
  const copy = liveClaimCopy.presence;
  const others = people.filter((p) => p.id !== me?.id);
  const selfName = liveClaimCopy.you;
  const names = [selfName, ...others.map((p) => firstNameOf(p.name))];

  return (
    <div className="flex items-center gap-2.5 text-footnote text-text-2" aria-label={copy.label}>
      <AvatarStack
        size="sm"
        max={6}
        className="pl-1.5"
        people={[
          me
            ? { id: me.id, name: selfName, tint: me.tint, buddy: me.buddy, online }
            : { id: ANONYMOUS, name: selfName, tint: "neutral", anonymous: true, online },
          ...others.map((p) => ({ id: p.id, name: firstNameOf(p.name), tint: p.tint, buddy: p.buddy, online })),
        ]}
      />
      <span className="min-w-0 truncate">{others.length === 0 ? copy.alone : copy.here(names)}</span>
    </div>
  );
}
