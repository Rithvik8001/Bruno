import { z } from "zod";
import { guestNameSchema } from "@/lib/members/schema";

export const CLAIM_CODE_PATTERN = /^[a-z0-9]{12}$/;

export const claimCodeSchema = z.string().regex(CLAIM_CODE_PATTERN);

const idSchema = z.string().min(1).max(64);

export const codeRefSchema = z.object({ code: claimCodeSchema });

export const toggleClaimSchema = z.object({
  code: claimCodeSchema,
  lineItemId: idSchema,
  on: z.boolean(),
});

export const joinAsGuestSchema = z.object({
  code: claimCodeSchema,
  pick: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("existing"), guestId: idSchema }),
    z.object({ kind: z.literal("new"), name: guestNameSchema }),
  ]),
});

export const billIdRefSchema = z.object({ billId: idSchema });

export type JoinAsGuestInput = z.input<typeof joinAsGuestSchema>;
