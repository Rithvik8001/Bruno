import { z } from "zod";
import { scanMessages } from "./messages";
import { SCAN_MIMES, type ScanMime } from "./rules";

const supportedTimeZones = new Set<string>([...Intl.supportedValuesOf("timeZone"), "UTC"]);

export const timeZoneSchema = z
  .string()
  .max(64)
  .refine((value) => supportedTimeZones.has(value), scanMessages.badTimeZone);

const idSchema = z.string().min(1);

export const startScanSchema = z.object({
  groupId: idSchema,
  contentType: z.enum(SCAN_MIMES as [ScanMime, ...ScanMime[]]),
  byteSize: z.number().int().positive(),
  timeZone: timeZoneSchema,
});

export const scanRefSchema = z.object({ scanId: idSchema });

export const extractScanSchema = scanRefSchema.extend({ timeZone: timeZoneSchema });

export const quotaSchema = z.object({ timeZone: timeZoneSchema });

export type StartScanInput = z.input<typeof startScanSchema>;
export type ExtractScanInput = z.input<typeof extractScanSchema>;
