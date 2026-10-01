import { z } from "zod";
import { AMOUNT_MAX_CENTS } from "@/lib/bills/schema";
import { timeZoneSchema } from "@/lib/scans/schema";
import { ASK_DECISIONS, REMIND_PEOPLE_MAX } from "./kinds";

const idSchema = z.string().min(1).max(64);

export const actionRefSchema = z.object({ actionId: idSchema, timeZone: timeZoneSchema });

export const confirmActionSchema = actionRefSchema.extend({
  edits: z.object({
    amount: z.number().int().min(1).max(AMOUNT_MAX_CENTS).nullable(),
    skip: z.array(z.string().min(1).max(140)).max(REMIND_PEOPLE_MAX),
    decision: z.enum(ASK_DECISIONS).nullable(),
  }),
});

export const proposeActionSchema = z.object({
  action: z.enum(["recordPayment", "remindDebts"]),
  personId: idSchema,
  groupId: idSchema.nullable(),
  threadId: idSchema.nullable(),
  timeZone: timeZoneSchema,
});

export type ConfirmActionInput = z.input<typeof confirmActionSchema>;
export type ProposeActionInput = z.input<typeof proposeActionSchema>;
