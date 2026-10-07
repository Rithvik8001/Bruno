import "server-only";
import { db } from "@/lib/db";
import type { PushSubscriptionInput } from "./schema";

const USER_AGENT_MAX = 300;

export async function saveSubscription(
  personId: string,
  subscription: PushSubscriptionInput,
  userAgent: string | null,
): Promise<void> {
  const data = {
    personId,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: userAgent?.slice(0, USER_AGENT_MAX) ?? null,
    failures: 0,
  };
  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { endpoint: subscription.endpoint, ...data },
    update: data,
  });
}

export async function removeSubscription(personId: string, endpoint: string): Promise<void> {
  await db.pushSubscription.deleteMany({ where: { personId, endpoint } });
}

export async function replaceSubscription(
  personId: string,
  oldEndpoint: string | null,
  subscription: PushSubscriptionInput,
  userAgent: string | null,
): Promise<void> {
  if (oldEndpoint && oldEndpoint !== subscription.endpoint) await removeSubscription(personId, oldEndpoint);
  await saveSubscription(personId, subscription, userAgent);
}
