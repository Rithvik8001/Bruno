"use server";

import { defineAction } from "@/lib/actions/action";
import {
  checkAssist,
  getAllowance,
  localDayWindow,
  reserveAssist,
} from "@/lib/ai/allowance";
import { aiMessages, allowanceCopy } from "@/lib/ai/messages";
import { AI_UPSTREAM_FAILURES, type Allowance } from "@/lib/ai/rules";
import { aiCooldown, breakerCooldown } from "@/lib/ai/throttle";
import {
  actionFail,
  actionInvalid,
  actionOk,
  actionRateLimited,
} from "@/lib/actions/errors";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { groupMessages } from "@/lib/groups/messages";
import { isActiveMemberOf } from "@/lib/groups/queries";
import type { Cents } from "@/lib/money";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { isScanConfigured } from "./config";
import { runExtraction } from "./extract";
import { failureMessage, type ScanFailure } from "./messages";
import { scanMessages } from "./messages";
import { normalizeExtraction } from "./normalize";
import type { ScanResult } from "./result";
import { maxBytesFor, mimeOfFormat } from "./rules";
import { extractScanSchema, scanRefSchema, startScanSchema } from "./schema";
import {
  deleteObject,
  fetchForModel,
  inspectObject,
  scanPublicId,
  signUpload,
} from "./storage";
import { maybeSweep } from "./sweep";

const MIB = 1024 * 1024;
const upstreamFailures: readonly ScanFailure[] = AI_UPSTREAM_FAILURES;

const toJson = (value: ScanResult): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export interface ScanUpload {
  readonly scanId: string;
  readonly uploadUrl: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly expiresAt: number;
}

export interface ScanSummary {
  readonly scanId: string;
  readonly itemCount: number;
  readonly total: Cents | null;
  readonly flaggedCount: number;
  readonly merchant: string | null;
  readonly currency: CurrencyCode;
}

export interface ScanExtracted {
  readonly summary: ScanSummary;
  readonly quota: Allowance;
}

async function markFailed(scanId: string, failure: ScanFailure): Promise<void> {
  await db.receiptScan.update({
    where: { id: scanId },
    data: { status: "FAILED", failure, completedAt: new Date() },
  });
}

export const createScanUpload = defineAction(
  startScanSchema,
  async ({ groupId, contentType, byteSize, timeZone }, { person }) => {
    if (!isScanConfigured())
      return actionFail("conflict", scanMessages.unavailable);
    if (!(await isActiveMemberOf(groupId, person.id)))
      return actionFail("forbidden", groupMessages.notMember);
    const verdict = await consumeRate("scanStart", person.id);
    if (!verdict.ok)
      return actionRateLimited(verdict.retryAfter, scanMessages.rateLimited);
    const cooling = await aiCooldown(person.id);
    if (cooling !== null)
      return actionRateLimited(cooling, aiMessages.cooling(cooling));
    const max = maxBytesFor(contentType);
    if (byteSize > max)
      return actionInvalid(
        { byteSize: scanMessages.tooLarge(max / MIB) },
        scanMessages.tooLarge(max / MIB),
      );

    const assist = await checkAssist(db, person.id, localDayWindow(timeZone));
    if (!assist.ok)
      return actionFail(
        "conflict",
        assist.reason === "quota"
          ? allowanceCopy.refused(assist.limit)
          : aiMessages.tooManyTries,
      );

    const objectKey = scanPublicId(person.id);
    const scan = await db.receiptScan.create({
      data: {
        personId: person.id,
        groupId,
        objectKey,
        contentType,
        byteSize,
        timeZone,
      },
      select: { id: true },
    });
    maybeSweep();
    const signed = signUpload(objectKey);
    return actionOk<ScanUpload>({
      scanId: scan.id,
      uploadUrl: signed.uploadUrl,
      fields: signed.fields,
      expiresAt: signed.expiresAt,
    });
  },
);

export const extractScan = defineAction(
  extractScanSchema,
  async ({ scanId }, { person }) => {
    const scan = await db.receiptScan.findFirst({
      where: { id: scanId, personId: person.id, status: "PENDING" },
      select: {
        id: true,
        objectKey: true,
        contentType: true,
        timeZone: true,
        group: { select: { currency: true } },
      },
    });
    if (!scan) return actionFail("notFound", scanMessages.gone);
    const verdict = await consumeRate("scanExtract", person.id);
    if (!verdict.ok)
      return actionRateLimited(verdict.retryAfter, scanMessages.rateLimited);
    if (!isCurrencyCode(scan.group.currency)) return actionFail("conflict");
    const currency = scan.group.currency;
    const contentType = scan.contentType;
    const mime = startScanSchema.shape.contentType.safeParse(contentType);
    if (!mime.success) {
      await markFailed(scan.id, "badType");
      return actionFail("invalid", scanMessages.badType);
    }

    const stored = await inspectObject(scan.objectKey);
    if (!stored) {
      await markFailed(scan.id, "notUploaded");
      return actionFail("notFound", scanMessages.notUploaded);
    }
    const storedMime = mimeOfFormat(stored.format);
    const max = maxBytesFor(mime.data);
    if (stored.bytes > max || storedMime === null) {
      await deleteObject(scan.objectKey).catch(() => undefined);
      await markFailed(scan.id, stored.bytes > max ? "tooLarge" : "badType");
      return actionFail(
        "invalid",
        stored.bytes > max
          ? scanMessages.tooLarge(max / MIB)
          : scanMessages.badType,
      );
    }

    const cooling = await aiCooldown(person.id);
    if (cooling !== null)
      return actionRateLimited(cooling, aiMessages.cooling(cooling));

    const window = localDayWindow(scan.timeZone);
    const reserved = await db.$transaction(async (tx) => {
      const assist = await reserveAssist(tx, person.id, window);
      if (!assist.ok) return assist;
      await tx.receiptScan.update({
        where: { id: scan.id },
        data: { status: "EXTRACTING", startedAt: new Date() },
      });
      return assist;
    });
    if (!reserved.ok)
      return actionFail(
        "conflict",
        reserved.reason === "quota"
          ? allowanceCopy.refused(reserved.limit)
          : aiMessages.tooManyTries,
      );

    const files = await fetchForModel(scan.objectKey, storedMime, stored.pages);
    if (!files) {
      await markFailed(scan.id, "unreadable");
      return actionFail("invalid", scanMessages.unreadable);
    }

    const outcome = await runExtraction(files, currency).catch(
      (error: unknown) => {
        console.error(
          "[scan] extraction failed",
          error instanceof Error ? `${error.name}: ${error.message}` : "unknown error",
        );
        return { ok: false as const, failure: "failed" as const };
      },
    );
    if (!outcome.ok) {
      await markFailed(scan.id, outcome.failure);
      if (!upstreamFailures.includes(outcome.failure))
        return actionFail("conflict", failureMessage(outcome.failure));
      return actionFail(
        "unknown",
        (await breakerCooldown()) === null
          ? failureMessage(outcome.failure)
          : aiMessages.busy,
      );
    }

    const result = normalizeExtraction(outcome.extraction, currency);
    const rejection: ScanFailure | null =
      outcome.extraction.problem === "notReceipt"
        ? "notReceipt"
        : outcome.extraction.problem === "unclear"
          ? "unreadable"
          : result.items.length === 0
            ? "noItems"
            : null;
    if (rejection) {
      await db.receiptScan.update({
        where: { id: scan.id },
        data: {
          status: "FAILED",
          failure: rejection,
          model: outcome.model,
          inputTokens: outcome.usage.inputTokens,
          outputTokens: outcome.usage.outputTokens,
          completedAt: new Date(),
        },
      });
      return actionFail("invalid", failureMessage(rejection));
    }

    await db.receiptScan.update({
      where: { id: scan.id },
      data: {
        status: "SUCCEEDED",
        result: toJson(result),
        model: outcome.model,
        inputTokens: outcome.usage.inputTokens,
        outputTokens: outcome.usage.outputTokens,
        completedAt: new Date(),
      },
    });

    const items = result.items.reduce(
      (sum, item) => sum + (item.price ?? 0),
      0,
    );
    const total =
      result.flaggedCount > 0
        ? result.printedTotal
        : ((items +
            (result.tax ?? 0) +
            (result.tip ?? 0) -
            (result.discount ?? 0)) as Cents);
    return actionOk<ScanExtracted>({
      summary: {
        scanId: scan.id,
        itemCount: result.items.length,
        total,
        flaggedCount: result.flaggedCount,
        merchant: result.merchant,
        currency,
      },
      quota: await getAllowance(person.id, scan.timeZone),
    });
  },
);

export const discardScan = defineAction(
  scanRefSchema,
  async ({ scanId }, { person }) => {
    const scan = await db.receiptScan.findFirst({
      where: {
        id: scanId,
        personId: person.id,
        status: { in: ["PENDING", "SUCCEEDED"] },
      },
      select: { id: true, objectKey: true },
    });
    if (!scan) return actionOk(null);
    await db.receiptScan.update({
      where: { id: scan.id },
      data: { status: "DISCARDED", completedAt: new Date() },
    });
    await deleteObject(scan.objectKey).catch(() => undefined);
    return actionOk(null);
  },
);
