import { z } from "zod";
import { currencyCodeSchema } from "./currency";
import { PAYMENT_METHODS } from "./ledger/rules";

const cents = z.number().int().nonnegative();
const id = z.string().min(1);

export const activityPayloadSchemas = {
  BILL_CREATED: z.object({ title: z.string(), total: cents, currency: currencyCodeSchema, itemCount: z.number().int() }),
  BILL_UPDATED: z.object({ title: z.string(), fields: z.array(z.string()).min(1) }),
  BILL_FINALIZED: z.object({ title: z.string(), total: cents, currency: currencyCodeSchema }),
  BILL_DELETED: z.object({ title: z.string() }),
  ITEM_CLAIMED: z.object({ lineItemId: id, name: z.string(), personId: id }),
  ITEM_UNCLAIMED: z.object({ lineItemId: id, name: z.string(), personId: id }),
  MEMBER_JOINED: z.object({
    personId: id,
    via: z.enum(["invite", "claim", "created", "added", "guest"]),
    fromGuestId: id.optional(),
  }),
  MEMBER_LEFT: z.object({ personId: id }),
  SETTLEMENT_RECORDED: z.object({
    settlementId: id,
    fromId: id,
    toId: id,
    amount: cents,
    currency: currencyCodeSchema,
    method: z.enum(PAYMENT_METHODS),
  }),
  SETTLEMENT_CONFIRMED: z.object({ settlementId: id, auto: z.boolean() }),
  SETTLEMENT_CANCELLED: z.object({ settlementId: id }),
} as const satisfies Record<string, z.ZodType>;

export type ActivityType = keyof typeof activityPayloadSchemas;

export type ActivityPayload<T extends ActivityType> = z.infer<(typeof activityPayloadSchemas)[T]>;

export interface ActivityDraft<T extends ActivityType> {
  readonly type: T;
  readonly payload: ActivityPayload<T>;
}

export function activity<T extends ActivityType>(type: T, payload: ActivityPayload<T>): ActivityDraft<T> {
  return { type, payload: activityPayloadSchemas[type].parse(payload) as ActivityPayload<T> };
}

export function parseActivityPayload<T extends ActivityType>(type: T, raw: unknown): ActivityPayload<T> | null {
  const parsed = activityPayloadSchemas[type].safeParse(raw);
  return parsed.success ? (parsed.data as ActivityPayload<T>) : null;
}
