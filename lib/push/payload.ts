import * as z from "zod/mini";

export const PUSH_KINDS = [
  "addedToGroup",
  "claimInvite",
  "billAdded",
  "claimReminder",
  "claimsComplete",
  "paymentReceived",
  "paymentUpdate",
  "debtReminder",
] as const;

export type PushKind = (typeof PUSH_KINDS)[number];

export interface PushContent {
  readonly title: string;
  readonly body: string;
  readonly path: string;
  readonly tag: string;
}

const PATH_MAX = 512;
const TEXT_MAX = 200;

export const pushPayloadSchema = z.object({
  kind: z.enum(PUSH_KINDS),
  title: z.string().check(z.minLength(1), z.maxLength(TEXT_MAX)),
  body: z.string().check(z.maxLength(TEXT_MAX)),
  url: z.string().check(
    z.startsWith("/"),
    z.maxLength(PATH_MAX),
    z.refine((path) => !path.startsWith("//")),
  ),
  tag: z.string().check(z.minLength(1), z.maxLength(TEXT_MAX)),
});

export type PushPayload = z.infer<typeof pushPayloadSchema>;

export function isPushKind(kind: string): kind is PushKind {
  return (PUSH_KINDS as readonly string[]).includes(kind);
}
