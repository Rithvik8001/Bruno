"use server";

import { headers } from "next/headers";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { pushEndpointSchema, pushSubscriptionSchema } from "./schema";
import { removeSubscription, saveSubscription } from "./subscriptions";
import { pushConfigured } from "./vapid";

export const savePushSubscription = defineAction(pushSubscriptionSchema, async (subscription, { person }) => {
  if (!pushConfigured()) return actionFail("conflict");
  const verdict = await consumeRate("pushWrite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  await saveSubscription(person.id, subscription, (await headers()).get("user-agent"));
  return actionOk({ endpoint: subscription.endpoint });
});

export const removePushSubscription = defineAction(pushEndpointSchema, async ({ endpoint }, { person }) => {
  const verdict = await consumeRate("pushWrite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  await removeSubscription(person.id, endpoint);
  return actionOk({ endpoint });
});
