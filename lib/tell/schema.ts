import { z } from "zod";
import { timeZoneSchema } from "@/lib/scans/schema";
import { cleanTellText } from "./guard";
import { tellMessages } from "./messages";
import { tellAnswersSchema } from "./result";
import { TELL_TEXT_MAX } from "./rules";

const idSchema = z.string().min(1);

export const tellTextSchema = z
  .string()
  .max(TELL_TEXT_MAX * 8)
  .transform(cleanTellText)
  .pipe(z.string().min(1, tellMessages.textMissing).max(TELL_TEXT_MAX, tellMessages.textTooLong));

export const draftBillSchema = z.object({
  groupId: idSchema,
  text: tellTextSchema,
  timeZone: timeZoneSchema,
});

export const tellRefSchema = z.object({ draftId: idSchema });

export const answerTellSchema = tellRefSchema.extend({ answers: tellAnswersSchema });

export type DraftBillInput = z.input<typeof draftBillSchema>;
