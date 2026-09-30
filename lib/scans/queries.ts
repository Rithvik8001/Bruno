import "server-only";
import { db } from "@/lib/db";
import { groupId as toGroupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { isScanConfigured } from "./config";
import { findDuplicate, type DuplicateBill } from "./duplicates";
import { countUsed, localDayWindow, quotaOf, type ScanQuota } from "./quota";
import { parseScanResult, type ScanResult } from "./result";

export interface ScanAvailability {
  readonly configured: boolean;
  readonly quota: ScanQuota;
}

export async function getScanQuota(personId: PersonId, timeZone: string): Promise<ScanQuota> {
  const person = await db.person.findUniqueOrThrow({ where: { id: personId }, select: { plan: true } });
  const used = await countUsed(db, personId, localDayWindow(timeZone));
  return quotaOf(used, person.plan);
}

export async function getScanAvailability(personId: PersonId, timeZone: string): Promise<ScanAvailability> {
  return { configured: isScanConfigured(), quota: await getScanQuota(personId, timeZone) };
}

export interface ScanReview {
  readonly scanId: string;
  readonly groupId: GroupId;
  readonly result: ScanResult;
  readonly duplicate: DuplicateBill | null;
}

export async function getScanReview(scanId: string, you: PersonId, today: string): Promise<ScanReview | null> {
  const row = await db.receiptScan.findFirst({
    where: { id: scanId, personId: you, status: "SUCCEEDED" },
    select: { id: true, groupId: true, result: true },
  });
  if (!row) return null;
  const result = parseScanResult(row.result);
  if (!result) return null;
  const duplicate = await findDuplicate(row.groupId, result, today);
  return { scanId: row.id, groupId: toGroupId(row.groupId), result, duplicate };
}
