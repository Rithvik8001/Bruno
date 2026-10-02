import { z } from "zod";
import { settlementMessages } from "./messages";

export const SETTLEMENT_NOTE_MAX = 60;
export const SETTLE_DIRECTIONS = ["received", "paid"] as const;
export type SettleDirection = (typeof SETTLE_DIRECTIONS)[number];

const idSchema = z.string().min(1);

export const recordSettlementSchema = z.object({
  groupId: idSchema,
  personId: idSchema,
  direction: z.enum(SETTLE_DIRECTIONS),
  amountCents: z.number().int().min(1, settlementMessages.amountMissing).max(999_999_999),
  note: z
    .string()
    .trim()
    .max(SETTLEMENT_NOTE_MAX, settlementMessages.noteTooLong(SETTLEMENT_NOTE_MAX))
    .nullable()
    .transform((note) => (note ? note : null)),
});

export const settlementRefSchema = z.object({ settlementId: idSchema });

export type RecordSettlementInput = z.input<typeof recordSettlementSchema>;
