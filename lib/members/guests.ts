import "server-only";
import { activity } from "@/lib/activity";
import { buddyShapeFor, type BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import type { Prisma } from "@/lib/generated/prisma/client";
import { defaultPersonTint } from "@/lib/people/defaults";
import { personSelect, type PersonRow } from "@/lib/people/person";
import { pendingGuestId, type PendingGuest } from "./pending";

export interface NewGuest {
  readonly groupId: string;
  readonly name: string;
  readonly addedById: string;
  readonly buddy?: BuddyShape;
  readonly tint?: PaletteTint;
}

export async function createGuestMember(tx: Prisma.TransactionClient, guest: NewGuest): Promise<PersonRow> {
  const created = await tx.person.create({
    data: {
      displayName: guest.name,
      tint: guest.tint ?? defaultPersonTint(guest.name),
      buddy: buddyShapeFor(guest.name, guest.buddy),
    },
    select: personSelect,
  });
  await tx.groupMember.create({
    data: { groupId: guest.groupId, personId: created.id, role: "MEMBER", addedById: guest.addedById },
  });
  return created;
}

export interface PendingGuests {
  readonly groupId: string;
  readonly addedById: string;
  readonly guests: readonly PendingGuest[];
}

export async function createPendingGuests(tx: Prisma.TransactionClient, { groupId, addedById, guests }: PendingGuests): Promise<Map<string, string>> {
  const created = new Map<string, string>();
  for (const guest of guests) {
    const person = await createGuestMember(tx, { groupId, name: guest.name, addedById });
    const joined = activity("MEMBER_JOINED", { personId: person.id, via: "guest" });
    await tx.activityEvent.create({ data: { groupId, actorId: addedById, type: joined.type, payload: joined.payload } });
    created.set(pendingGuestId(guest.key), person.id);
  }
  return created;
}
