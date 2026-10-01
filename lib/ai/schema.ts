import { z } from "zod";
import { timeZoneSchema } from "@/lib/scans/schema";

export const allowanceSchema = z.object({ timeZone: timeZoneSchema });
