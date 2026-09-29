import { z } from "zod";
import { currencyCodeSchema, DEFAULT_CURRENCY } from "@/lib/currency";
import { GROUP_ART_IDS, type GroupArtId } from "@/lib/design-system/icons3d";
import { PALETTE_TINTS, type PaletteTint } from "@/lib/design-system/tokens";

export const GROUP_NAME_MAX = 40;

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Give the group a name.")
  .max(GROUP_NAME_MAX, `Keep it under ${GROUP_NAME_MAX} characters.`);

export const paletteTintSchema = z.enum(PALETTE_TINTS as unknown as [PaletteTint, ...PaletteTint[]]);

export const groupArtSchema = z.enum(GROUP_ART_IDS as unknown as [GroupArtId, ...GroupArtId[]]).nullable();

export const groupInputSchema = z.object({
  name: groupNameSchema,
  tint: paletteTintSchema,
  art: groupArtSchema,
  currency: currencyCodeSchema.default(DEFAULT_CURRENCY),
});

export type GroupInput = z.input<typeof groupInputSchema>;
export type GroupValues = z.output<typeof groupInputSchema>;

export const groupIdSchema = z.string().min(1);
