import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";

export class TellGoneError extends Error {
  constructor() {
    super("Tell Bruno draft is no longer available");
    this.name = "TellGoneError";
  }
}

export async function consumeTellDraft(
  tx: Prisma.TransactionClient,
  draftId: string | undefined,
  personId: string,
  groupId: string,
): Promise<void> {
  if (!draftId) return;
  const consumed = await tx.tellDraft.updateMany({
    where: { id: draftId, personId, groupId, status: "SUCCEEDED" },
    data: { status: "CONSUMED", text: null, result: Prisma.DbNull, answers: Prisma.DbNull },
  });
  if (consumed.count === 0) throw new TellGoneError();
}
