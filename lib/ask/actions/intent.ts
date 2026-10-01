import { z } from "zod";
import { BILL_TITLE_MAX } from "@/lib/bills/schema";
import { PAYMENT_METHODS } from "@/lib/ledger/rules";
import { SETTLE_DIRECTIONS } from "@/lib/settlements/schema";
import { ACTION_BILLS_MAX, ASK_ACTION_KINDS, ASK_PORTIONS } from "./kinds";

const idSchema = z.string().min(1).max(64);

export const askIntentSchema = z.object({
  action: z.enum(ASK_ACTION_KINDS),
  personId: idSchema.nullable(),
  secondId: idSchema.nullable(),
  groupId: idSchema.nullable(),
  billId: idSchema.nullable(),
  billIds: z.array(idSchema).max(ACTION_BILLS_MAX),
  settlementId: idSchema.nullable(),
  direction: z.enum(SETTLE_DIRECTIONS).nullable(),
  amount: z.number().positive().finite().nullable(),
  portion: z.enum(ASK_PORTIONS).nullable(),
  method: z.enum(PAYMENT_METHODS),
  title: z.string().min(1).max(BILL_TITLE_MAX).nullable(),
  date: z.iso.date().nullable(),
});

export type AskIntent = z.output<typeof askIntentSchema>;

export const EMPTY_INTENT = {
  personId: null,
  secondId: null,
  groupId: null,
  billId: null,
  billIds: [],
  settlementId: null,
  direction: null,
  amount: null,
  portion: null,
  method: "OTHER",
  title: null,
  date: null,
} as const satisfies Omit<AskIntent, "action">;

export function parseIntent(raw: unknown): AskIntent | null {
  const parsed = askIntentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
