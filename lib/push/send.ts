import "server-only";
import { createHash } from "node:crypto";
import { sendNotification, WebPushError } from "web-push";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { PushKind, PushPayload } from "./payload";
import { pushConfigured } from "./vapid";

const TTL_SECONDS = 24 * 60 * 60;
const MAX_FAILURES = 5;
const GONE = new Set([404, 410]);

interface StoredSubscription {
  readonly id: string;
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
  readonly failures: number;
}

async function reserve(personId: string, kind: PushKind, dedupeKey: string): Promise<boolean> {
  try {
    await db.pushLog.create({ data: { personId, kind, dedupeKey } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

const topicOf = (tag: string) => createHash("sha256").update(tag).digest("base64url").slice(0, 32);

function statusOf(error: unknown): number | null {
  if (error instanceof WebPushError) return error.statusCode;
  return null;
}

async function sendOne(subscription: StoredSubscription, payload: PushPayload): Promise<boolean> {
  try {
    await sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: TTL_SECONDS, urgency: "high", topic: topicOf(payload.tag) },
    );
    await db.pushSubscription.update({ where: { id: subscription.id }, data: { failures: 0, lastSuccessAt: new Date() } });
    return true;
  } catch (error) {
    const status = statusOf(error);
    if ((status !== null && GONE.has(status)) || subscription.failures + 1 >= MAX_FAILURES) {
      await db.pushSubscription.deleteMany({ where: { id: subscription.id } });
    } else {
      await db.pushSubscription.updateMany({ where: { id: subscription.id }, data: { failures: { increment: 1 } } });
    }
    if (status === null || !GONE.has(status)) console.error(`[push] ${payload.kind} failed`, status ?? error);
    return false;
  }
}

export interface PushDelivery {
  readonly kind: PushKind;
  readonly personId: string;
  readonly dedupeKey: string;
  readonly payload: () => PushPayload;
}

export async function deliverPush({ kind, personId, dedupeKey, payload }: PushDelivery): Promise<boolean> {
  if (!pushConfigured()) return false;
  const subscriptions = await db.pushSubscription.findMany({
    where: { personId, person: { userId: { not: null }, deletedAt: null, mergedIntoId: null } },
    select: { id: true, endpoint: true, p256dh: true, auth: true, failures: true },
  });
  if (subscriptions.length === 0) return false;
  if (!(await reserve(personId, kind, dedupeKey))) return false;
  const built = payload();
  const results = await Promise.all(subscriptions.map((subscription) => sendOne(subscription, built)));
  if (results.some(Boolean)) return true;
  await db.pushLog.delete({ where: { dedupeKey } }).catch(() => undefined);
  return false;
}
