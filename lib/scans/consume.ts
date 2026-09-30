import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { billPublicId, moveObject } from "./storage";

export class ScanGoneError extends Error {
  constructor() {
    super("Receipt scan is no longer available");
    this.name = "ScanGoneError";
  }
}

export async function consumeScan(
  tx: Prisma.TransactionClient,
  scanId: string | undefined,
  personId: string,
  groupId: string,
): Promise<string | null> {
  if (!scanId) return null;
  const consumed = await tx.receiptScan.updateMany({
    where: { id: scanId, personId, groupId, status: "SUCCEEDED" },
    data: { status: "CONSUMED" },
  });
  if (consumed.count === 0) throw new ScanGoneError();
  return scanId;
}

export async function keepReceipt(
  scanId: string,
  billId: string,
): Promise<void> {
  const scan = await db.receiptScan.findUnique({
    where: { id: scanId },
    select: { objectKey: true, status: true },
  });
  if (!scan || scan.status !== "CONSUMED") return;
  const next = billPublicId(billId);
  try {
    await moveObject(scan.objectKey, next);
    await db.receiptScan.update({
      where: { id: scanId },
      data: { objectKey: next },
    });
  } catch (error) {
    console.error("[scan] keeping receipt failed", error);
  }
}
