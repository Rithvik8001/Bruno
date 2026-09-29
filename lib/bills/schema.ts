import { z } from "zod";
import { billMessages } from "./messages";
import { FULL_PERCENT_BPS, SPLIT_METHODS } from "./types";

export const BILL_TITLE_MAX = 60;
export const ITEM_NAME_MAX = 60;
export const BILL_ITEMS_MAX = 100;
export const ITEM_QUANTITY_MAX = 99;
export const SPLIT_SHARES_MAX = 99;
export const AMOUNT_MAX_CENTS = 999_999_999;

const idSchema = z.string().min(1);
const centsSchema = z.number().int().min(0).max(AMOUNT_MAX_CENTS);
const bpsSchema = z.number().int().min(0).max(FULL_PERCENT_BPS);

export const billTitleSchema = z
  .string()
  .trim()
  .min(1, billMessages.titleMissing)
  .max(BILL_TITLE_MAX, billMessages.titleTooLong(BILL_TITLE_MAX));

export const billTipSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NONE") }),
  z.object({ kind: z.literal("PERCENT"), bps: bpsSchema }),
  z.object({ kind: z.literal("AMOUNT"), cents: centsSchema }),
]);

export const billItemSchema = z.object({
  name: z.string().trim().min(1, billMessages.itemNameMissing).max(ITEM_NAME_MAX, billMessages.itemNameTooLong(ITEM_NAME_MAX)),
  quantity: z.number().int().min(1).max(ITEM_QUANTITY_MAX),
  priceCents: centsSchema,
  claimedBy: z.array(idSchema),
});

export const billParticipantSchema = z.object({
  personId: idSchema,
  shares: z.number().int().min(1).max(SPLIT_SHARES_MAX),
  percentBps: bpsSchema.nullable(),
  amountCents: centsSchema.nullable(),
});

const billFieldsSchema = z.object({
  title: billTitleSchema,
  occurredOn: z.iso.date(billMessages.dateInvalid),
  payerId: idSchema,
  items: z.array(billItemSchema).min(1, billMessages.noItems).max(BILL_ITEMS_MAX, billMessages.tooManyItems(BILL_ITEMS_MAX)),
  taxCents: centsSchema,
  tip: billTipSchema,
  discountCents: centsSchema,
  method: z.enum(SPLIT_METHODS),
  participants: z.array(billParticipantSchema),
});

type BillFields = z.output<typeof billFieldsSchema>;

function refineBill(value: BillFields, ctx: z.RefinementCtx): void {
  const ids = value.participants.map((p) => p.personId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", path: ["participants"], message: billMessages.duplicatePerson });
  }
  value.items.forEach((item, index) => {
    if (new Set(item.claimedBy).size !== item.claimedBy.length) {
      ctx.addIssue({ code: "custom", path: ["items", index, "claimedBy"], message: billMessages.duplicatePerson });
    }
  });
}

export const createBillSchema = billFieldsSchema.extend({ groupId: idSchema }).superRefine(refineBill);

export const updateBillSchema = billFieldsSchema.extend({ billId: idSchema }).superRefine(refineBill);

export const billRefSchema = z.object({ billId: idSchema });

export type BillTipValue = z.output<typeof billTipSchema>;
export type CreateBillInput = z.input<typeof createBillSchema>;
export type CreateBillValues = z.output<typeof createBillSchema>;
export type BillValues = BillFields;
export type UpdateBillInput = z.input<typeof updateBillSchema>;
