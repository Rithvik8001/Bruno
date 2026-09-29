import { z } from "zod";
import { BUDDY_SHAPES, type BuddyShape } from "@/lib/design-system/buddies";
import { paletteTintSchema } from "@/lib/groups/schema";

export const DISPLAY_NAME_MAX = 24;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(DISPLAY_NAME_MAX, `Keep it under ${DISPLAY_NAME_MAX} characters.`),
  buddy: z.enum(BUDDY_SHAPES as unknown as [BuddyShape, ...BuddyShape[]]),
  tint: paletteTintSchema,
});

export type ProfileInput = z.input<typeof profileSchema>;
