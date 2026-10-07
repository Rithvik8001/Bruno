import { z } from "zod";

const ENDPOINT_MAX = 2048;
const KEY_MAX = 256;
const base64Url = z.string().min(1).max(KEY_MAX).regex(/^[A-Za-z0-9_-]+=*$/);

export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(ENDPOINT_MAX),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: base64Url, auth: base64Url }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const pushEndpointSchema = z.object({ endpoint: z.url({ protocol: /^https$/ }).max(ENDPOINT_MAX) });

export const pushResubscribeSchema = z.object({
  oldEndpoint: z.url({ protocol: /^https$/ }).max(ENDPOINT_MAX).nullable(),
  subscription: pushSubscriptionSchema,
});
