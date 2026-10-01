import "server-only";
import { db } from "@/lib/db";
import { TELL_SWEEP_AFTER_MS, TELL_SWEEP_CHANCE } from "./rules";

export async function sweepStaleTellDrafts(now: Date = new Date()): Promise<void> {
  await db.tellDraft.deleteMany({
    where: {
      status: { in: ["DRAFTING", "SUCCEEDED", "FAILED", "DISCARDED"] },
      createdAt: { lt: new Date(now.getTime() - TELL_SWEEP_AFTER_MS) },
    },
  });
}

export function maybeSweepTell(): void {
  if (Math.random() >= TELL_SWEEP_CHANCE) return;
  void sweepStaleTellDrafts().catch((error: unknown) => console.error("[tell] sweep failed", error));
}
