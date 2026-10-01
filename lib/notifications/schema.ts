import { z } from "zod";
import { NOTIFICATION_CATEGORIES } from "./kinds";

const TOKEN_MAX = 1024;

export const notificationPrefSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES),
  enabled: z.boolean(),
});

export const emailTokenSchema = z.object({ token: z.string().min(1).max(TOKEN_MAX) });
