import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";

export interface GuestMerge {
  readonly guestId: string;
  readonly claimerId: string;
  readonly groupId: string;
}

const PAYLOAD_PERSON_KEYS = ["personId", "fromId", "toId"] as const;

export async function mergeGuestInto(tx: Prisma.TransactionClient, { guestId, claimerId, groupId }: GuestMerge): Promise<void> {
  await tx.billParticipant.updateMany({ where: { personId: guestId }, data: { personId: claimerId } });
  await tx.claim.updateMany({ where: { personId: guestId }, data: { personId: claimerId } });
  await tx.bill.updateMany({ where: { payerId: guestId }, data: { payerId: claimerId } });
  await tx.bill.updateMany({ where: { createdById: guestId }, data: { createdById: claimerId } });
  await tx.settlement.updateMany({ where: { fromId: guestId }, data: { fromId: claimerId } });
  await tx.settlement.updateMany({ where: { toId: guestId }, data: { toId: claimerId } });
  await tx.settlement.updateMany({ where: { recordedById: guestId }, data: { recordedById: claimerId } });
  await tx.activityEvent.updateMany({ where: { actorId: guestId }, data: { actorId: claimerId } });
  for (const key of PAYLOAD_PERSON_KEYS) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "activity_event"
      SET payload = jsonb_set(payload::jsonb, ${`{${key}}`}::text[], to_jsonb(${claimerId}::text))
      WHERE payload->>${key} = ${guestId}
    `);
  }
  await tx.groupMember.update({
    where: { groupId_personId: { groupId, personId: guestId } },
    data: { personId: claimerId },
  });
  await tx.groupMember.updateMany({ where: { addedById: guestId }, data: { addedById: claimerId } });
  await tx.guestToken.deleteMany({ where: { personId: guestId } });
  await tx.person.update({ where: { id: guestId }, data: { mergedIntoId: claimerId } });
}
