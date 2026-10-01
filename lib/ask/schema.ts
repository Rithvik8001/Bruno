import { z } from "zod";
import { timeZoneSchema } from "@/lib/scans/schema";
import { cleanTellText } from "@/lib/tell/guard";
import { askMessages } from "./messages";
import { ASK_SLOTS } from "./result";
import { ASK_CLARIFY_MAX, ASK_MIN_LETTERS, ASK_TEXT_MAX } from "./rules";

const idSchema = z.string().min(1).max(64);

export const askTextSchema = z
  .string()
  .max(ASK_TEXT_MAX * 8)
  .transform(cleanTellText)
  .pipe(z.string().min(1, askMessages.textMissing).max(ASK_TEXT_MAX, askMessages.textTooLong));

export const askPickSchema = z.object({ slot: z.enum(ASK_SLOTS), ref: idSchema });

export const askSchema = z.object({
  text: askTextSchema,
  timeZone: timeZoneSchema,
  groupId: idSchema.nullable(),
  threadId: idSchema.nullable(),
  clarifies: z.object({ questionId: idSchema, picks: z.array(askPickSchema).min(1).max(ASK_CLARIFY_MAX) }).nullable(),
});

export const askQuotaSchema = z.object({ timeZone: timeZoneSchema });

export type AskInput = z.input<typeof askSchema>;
export type AskValues = z.output<typeof askSchema>;

const LETTER = /[\p{L}\p{M}]/gu;

export function askHasSubstance(text: string): boolean {
  return (text.match(LETTER) ?? []).length >= ASK_MIN_LETTERS;
}
