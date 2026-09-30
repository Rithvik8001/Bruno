import "server-only";
import { db } from "@/lib/db";
import { SWEEP_AFTER_MS, SWEEP_BATCH, SWEEP_CHANCE } from "./rules";
import { deleteObject } from "./storage";

export async function sweepStaleScans(now: Date = new Date()): Promise<void> {
  const stale = await db.receiptScan.findMany({
    where: {
      status: { in: ["PENDING", "DISCARDED", "FAILED"] },
      purgedAt: null,
      createdAt: { lt: new Date(now.getTime() - SWEEP_AFTER_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: SWEEP_BATCH,
    select: { id: true, objectKey: true },
  });
  for (const scan of stale) {
    await deleteObject(scan.objectKey).catch(() => undefined);
    await db.receiptScan.update({ where: { id: scan.id }, data: { purgedAt: now } });
  }
}

export function maybeSweep(): void {
  if (Math.random() >= SWEEP_CHANCE) return;
  void sweepStaleScans().catch((error: unknown) => console.error("[scan] sweep failed", error));
}
