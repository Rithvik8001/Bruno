import { z } from "zod";
import { authRules } from "@/lib/auth/rules";
import { BUDDY_SHAPES, type BuddyShape } from "@/lib/design-system/buddies";
import { groupIdSchema, paletteTintSchema } from "@/lib/groups/schema";
import { DISPLAY_NAME_MAX } from "@/lib/people/schema";
import { memberMessages } from "./messages";
import { normalizeName } from "./names";

const EMAIL_MAX = 254;
const CLAIM_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export type LookupQuery = { readonly kind: "email" | "username"; readonly value: string };

export function parseLookupQuery(raw: string): LookupQuery | null {
  const value = raw.trim().toLowerCase();
  if (value.length === 0 || value.length > EMAIL_MAX) return null;
  if (!value.startsWith("@") && z.email().safeParse(value).success) return { kind: "email", value };
  const handle = value.replace(/^@/, "");
  const { min, max, pattern } = authRules.username;
  return handle.length >= min && handle.length <= max && pattern.test(handle) ? { kind: "username", value: handle } : null;
}

export const lookupQuerySchema = z
  .string()
  .max(EMAIL_MAX, memberMessages.queryInvalid)
  .transform((raw, ctx) => {
    const parsed = parseLookupQuery(raw);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: raw.trim() ? memberMessages.queryInvalid : memberMessages.queryEmpty });
      return z.NEVER;
    }
    return parsed;
  });

const personRefSchema = z.string().min(1).max(64);

export const guestNameSchema = z
  .string()
  .max(DISPLAY_NAME_MAX * 4)
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(1, memberMessages.nameMissing)
      .max(DISPLAY_NAME_MAX, memberMessages.nameTooLong(DISPLAY_NAME_MAX)),
  );

const buddySchema = z.enum(BUDDY_SHAPES as unknown as [BuddyShape, ...BuddyShape[]]);

export const lookupSchema = z.object({ groupId: groupIdSchema, query: lookupQuerySchema });
export const addFoundSchema = z.object({ groupId: groupIdSchema, ticket: z.string().min(1).max(512) });
export const guestSchema = z.object({
  groupId: groupIdSchema,
  name: guestNameSchema,
  buddy: buddySchema.optional(),
  tint: paletteTintSchema.optional(),
});
export const guestUpdateSchema = z.object({
  groupId: groupIdSchema,
  personId: personRefSchema,
  name: guestNameSchema.optional(),
  buddy: buddySchema.optional(),
  tint: paletteTintSchema.optional(),
});
export const guestRefSchema = z.object({ groupId: groupIdSchema, personId: personRefSchema });
export const claimSchema = z.object({ token: z.string().regex(CLAIM_TOKEN) });

export type LookupInput = z.input<typeof lookupSchema>;
export type GuestInput = z.input<typeof guestSchema>;
export type GuestUpdateInput = z.input<typeof guestUpdateSchema>;
