import "server-only";
import type { AppContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId } from "@/lib/domain/ids";
import type { Claimer as ClaimAccess } from "@/lib/domain/permissions";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { readGuestSession } from "./guest-session";

export type ClaimerKind = ClaimAccess["kind"];

export interface Claimer {
  readonly kind: ClaimerKind;
  readonly person: PersonView;
  readonly access: ClaimAccess;
}

export async function resolveClaimer(groupId: string, viewer: AppContext | null): Promise<Claimer | null> {
  if (viewer) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, personId: viewer.person.id, leftAt: null },
      select: { role: true },
    });
    if (!membership) return { kind: "joining", person: viewer.person, access: { kind: "joining" } };
    return {
      kind: "member",
      person: viewer.person,
      access: {
        kind: "member",
        membership: { groupId: toGroupId(groupId), personId: toPersonId(viewer.person.id), role: membership.role, leftAt: null },
      },
    };
  }
  const session = await readGuestSession();
  if (!session || session.groupId !== groupId) return null;
  const guest = await db.groupMember.findFirst({
    where: { groupId, personId: session.personId, leftAt: null, person: { userId: null, mergedIntoId: null, deletedAt: null } },
    select: { person: { select: personSelect } },
  });
  return guest ? { kind: "guest", person: toPersonView(guest.person), access: { kind: "guest" } } : null;
}
