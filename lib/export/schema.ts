import { z } from "zod";
import { parseIsoDay } from "@/lib/calendar";
import { exportMessages } from "./messages";
import { EXPORT_KINDS, EXPORT_RANGES, type ExportFilter } from "./rules";

const GROUP_ID_MAX = 64;

const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => parseIsoDay(value) !== null);

const filterShape = {
  group: z.string().min(1).max(GROUP_ID_MAX),
  range: z.enum(EXPORT_RANGES),
  from: daySchema.optional(),
  to: daySchema.optional(),
} as const;

function validSpan(value: ExportFilter): boolean {
  if (value.range !== "custom") return true;
  return value.from !== undefined && value.to !== undefined && value.from <= value.to;
}

const spanIssue = { message: exportMessages.dates, path: ["from"] };

export const exportPreviewSchema = z.object(filterShape).refine(validSpan, spanIssue);

export const exportRequestSchema = z
  .object({
    ...filterShape,
    kinds: z
      .array(z.enum(EXPORT_KINDS))
      .min(1, exportMessages.kinds)
      .max(EXPORT_KINDS.length)
      .refine((kinds) => new Set(kinds).size === kinds.length, exportMessages.kinds),
  })
  .refine(validSpan, spanIssue);
