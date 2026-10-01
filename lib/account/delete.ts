import "server-only";
import { activity } from "@/lib/activity";
import { db } from "@/lib/db";
import type { PersonId } from "@/lib/domain/ids";
import { defaultPersonTint } from "@/lib/people/defaults";
import type { AccountInspection } from "./queries";
import { DELETED_MEMBER_NAME } from "./rules";

export interface AccountOwner {
  readonly personId: PersonId;
  readonly userId: string;
  readonly email: string;
}

export interface ErasedAccount {
  readonly scanKeys: readonly string[];
  readonly timeZone: string | null;
}

export async function eraseAccount(owner: AccountOwner, plan: Pick<AccountInspection, "shared" | "solo">): Promise<ErasedAccount> {
  const { personId, userId, email } = owner;
  const now = new Date();
  const left = activity("MEMBER_LEFT", { personId });

  return db.$transaction(async (tx) => {
    const before = await tx.person.findUniqueOrThrow({ where: { id: personId }, select: { timeZone: true } });
    await tx.groupMember.updateMany({ where: { personId, leftAt: null }, data: { leftAt: now } });
    if (plan.shared.length > 0) {
      await tx.activityEvent.createMany({
        data: plan.shared.map((groupId) => ({ groupId, actorId: personId, type: left.type, payload: left.payload })),
      });
    }
    if (plan.solo.length > 0) await tx.group.updateMany({ where: { id: { in: [...plan.solo] } }, data: { deletedAt: now } });

    await tx.guestToken.deleteMany({ where: { OR: [{ personId }, { createdById: personId }] } });
    await tx.askAction.deleteMany({ where: { personId } });
    await tx.askQuestion.deleteMany({ where: { personId } });
    await tx.tellDraft.deleteMany({ where: { personId } });
    await tx.emailLog.deleteMany({ where: { personId } });

    const scans = await tx.receiptScan.findMany({
      where: { personId, status: { not: "CONSUMED" } },
      select: { id: true, objectKey: true, purgedAt: true },
    });
    await tx.receiptScan.deleteMany({ where: { id: { in: scans.map((scan) => scan.id) } } });

    await tx.person.update({
      where: { id: personId },
      data: {
        userId: null,
        displayName: DELETED_MEMBER_NAME,
        tint: defaultPersonTint(DELETED_MEMBER_NAME),
        buddy: null,
        email: null,
        timeZone: null,
        plan: "FREE",
        notifyBills: false,
        notifyClaims: false,
        notifyPayments: false,
        notifyWeekly: false,
        notifyMonthly: false,
        deletedAt: now,
      },
    });
    await tx.verification.deleteMany({ where: { identifier: { contains: email } } });
    await tx.user.delete({ where: { id: userId } });

    return { scanKeys: scans.filter((scan) => scan.purgedAt === null).map((scan) => scan.objectKey), timeZone: before.timeZone };
  });
}
