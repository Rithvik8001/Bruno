import "server-only";
import { buddyShapeFor, type BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import type { Prisma } from "@/lib/generated/prisma/client";
import { defaultPersonTint } from "@/lib/people/defaults";
import { personSelect, type PersonRow } from "@/lib/people/person";

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
