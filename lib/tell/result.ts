import { z } from "zod";
import { AMOUNT_MAX_CENTS, ITEM_NAME_MAX, ITEM_QUANTITY_MAX, SPLIT_SHARES_MAX } from "@/lib/bills/schema";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/bills/types";
import { currencyCodeSchema, type CurrencyCode } from "@/lib/currency";
import type { Cents } from "@/lib/money";

export const TELL_SPLIT_METHODS = ["EVEN", "SHARES", "PERCENT", "AMOUNT"] as const;
export type TellSplitMethod = (typeof TELL_SPLIT_METHODS)[number];

export interface TellPerson {
  readonly name: string;
  readonly memberIds: readonly string[];
}

export interface TellItem {
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents | null;
  readonly category: ItemCategory | null;
  readonly rest: boolean;
  readonly everyone: boolean;
  readonly claimants: readonly number[];
}

export interface TellSplitPart {
  readonly person: number;
  readonly shares: number | null;
  readonly percent: number | null;
  readonly amount: Cents | null;
}

export interface TellSplit {
  readonly method: TellSplitMethod;
  readonly parts: readonly TellSplitPart[];
}

export type TellQuestion =
  | { readonly kind: "who"; readonly person: number }
  | { readonly kind: "amount" }
  | { readonly kind: "payer" };

export interface TellResult {
  readonly title: string | null;
  readonly occurredOn: string | null;
  readonly currency: CurrencyCode;
  readonly stated: Cents | null;
  readonly people: readonly TellPerson[];
  readonly payer: number | null;
  readonly items: readonly TellItem[];
  readonly tax: Cents | null;
  readonly tip: Cents | null;
  readonly tipPercent: number | null;
  readonly discount: Cents | null;
  readonly split: TellSplit | null;
  readonly questions: readonly TellQuestion[];
}

export type TellPersonAnswer =
  | { readonly kind: "member"; readonly id: string }
  | { readonly kind: "guest" }
  | { readonly kind: "skip" };

export interface TellAnswers {
  readonly people: Readonly<Record<string, TellPersonAnswer>>;
  readonly amount: Cents | null;
  readonly payerId: string | null;
}

export const NO_ANSWERS: TellAnswers = { people: {}, amount: null, payerId: null };

const centsSchema = z.number().int().min(0).max(AMOUNT_MAX_CENTS).transform((n) => n as Cents);
const indexSchema = z.number().int().min(0);
const idSchema = z.string().min(1).max(64);

const tellItemSchema = z.object({
  name: z.string().min(1).max(ITEM_NAME_MAX),
  quantity: z.number().int().min(1).max(ITEM_QUANTITY_MAX),
  price: centsSchema.nullable(),
  category: z.enum(ITEM_CATEGORIES).nullable(),
  rest: z.boolean(),
  everyone: z.boolean(),
  claimants: z.array(indexSchema),
});

const tellQuestionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("who"), person: indexSchema }),
  z.object({ kind: z.literal("amount") }),
  z.object({ kind: z.literal("payer") }),
]);

export const tellResultSchema: z.ZodType<TellResult> = z.object({
  title: z.string().nullable(),
  occurredOn: z.iso.date().nullable(),
  currency: currencyCodeSchema,
  stated: centsSchema.nullable(),
  people: z.array(z.object({ name: z.string().min(1), memberIds: z.array(idSchema) })),
  payer: indexSchema.nullable(),
  items: z.array(tellItemSchema),
  tax: centsSchema.nullable(),
  tip: centsSchema.nullable(),
  tipPercent: z.number().int().min(0).max(100).nullable(),
  discount: centsSchema.nullable(),
  split: z
    .object({
      method: z.enum(TELL_SPLIT_METHODS),
      parts: z.array(
        z.object({
          person: indexSchema,
          shares: z.number().int().min(1).max(SPLIT_SHARES_MAX).nullable(),
          percent: z.number().int().min(0).max(100).nullable(),
          amount: centsSchema.nullable(),
        }),
      ),
    })
    .nullable(),
  questions: z.array(tellQuestionSchema),
});

export const tellAnswersSchema: z.ZodType<TellAnswers> = z.object({
  people: z.record(
    z.string().regex(/^\d{1,2}$/),
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("member"), id: idSchema }),
      z.object({ kind: z.literal("guest") }),
      z.object({ kind: z.literal("skip") }),
    ]),
  ),
  amount: centsSchema.nullable(),
  payerId: idSchema.nullable(),
});

export function parseTellResult(raw: unknown): TellResult | null {
  const parsed = tellResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseTellAnswers(raw: unknown): TellAnswers {
  const parsed = tellAnswersSchema.safeParse(raw);
  return parsed.success ? parsed.data : NO_ANSWERS;
}
