import "server-only";
import { getAllowance } from "@/lib/ai/allowance";
import type { Allowance } from "@/lib/ai/rules";
import { db } from "@/lib/db";
import { groupId as toGroupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { isTellConfigured } from "@/lib/tell/config";
import { isScanConfigured } from "./config";
import { findDuplicate, type DuplicateBill } from "./duplicates";
import { parseScanResult, type ScanResult } from "./result";

export interface ScanAvailability {
  readonly configured: boolean;
  readonly tellConfigured: boolean;
  readonly quota: Allowance;
}

export async function getScanAvailability(personId: PersonId, timeZone: string): Promise<ScanAvailability> {
  return { configured: isScanConfigured(), tellConfigured: isTellConfigured(), quota: await getAllowance(personId, timeZone) };
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
