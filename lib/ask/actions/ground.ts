import "server-only";
import { z } from "zod";
import { routes } from "@/lib/auth/rules";
import { BILL_TITLE_MAX } from "@/lib/bills/schema";
import type { PaymentMethod } from "@/lib/ledger/rules";
import { SETTLE_DIRECTIONS } from "@/lib/settlements/schema";
import { cleanTellText, numbersSaid } from "@/lib/tell/guard";
import type { AskContext } from "../account";
import { dayOrNull, groupAt, personAt } from "../tools/shared";
import type { AskNote } from "./card";
import { EMPTY_INTENT, type AskIntent } from "./intent";
import { ACTION_BILLS_MAX, ASK_PROPOSE_KINDS } from "./kinds";

export const proposeSchema = z.object({
  action: z.enum(ASK_PROPOSE_KINDS),
  person: z.number().int().nullable().describe("p-index of the other person: who to remind, who paid or was paid, or the new payer. Null for everyone or when not needed"),
  second: z.number().int().nullable().describe("Only for a payment between two people who are both not the user: the p-index of the one who was paid. Otherwise null"),
  group: z.number().int().nullable().describe("g-index when the user names a group. Otherwise null"),
  bills: z.array(z.string()).nullable().describe("Bill refs from findBills (b1, b2...) that fit what the user described. Null when no bill is involved"),
  direction: z.enum(SETTLE_DIRECTIONS).nullable().describe("recordPayment only. paid: the user paid the person. received: the person paid the user. Null when the user did not say"),
  amount: z.number().nullable().describe("A number the user wrote in their message, exactly as written. Null when the message has no amount"),
  whole: z.boolean().describe("True when the user wants to settle everything: settle up, square up, all of it, in full"),
  title: z.string().nullable().describe("renameBill only: the new name, copied from the user's message. Otherwise null"),
  date: z.string().nullable().describe("changeDate only: the new date as YYYY-MM-DD. Otherwise null"),
});

export type ProposeInput = z.output<typeof proposeSchema>;

export type Grounded = { readonly kind: "intent"; readonly intent: AskIntent } | { readonly kind: "note"; readonly note: AskNote };

const DELETE_WORDS = /\b(delete|deletes|deleting|remove|removing|trash|scrap|erase|bin|get rid)\b/i;

const METHOD_WORDS: readonly (readonly [RegExp, PaymentMethod])[] = [
  [/\bcash\b/i, "CASH"],
  [/\bvenmo\b/i, "VENMO"],
  [/\bpaypal\b/i, "PAYPAL"],
  [/\b(bank|transfer|wire|upi|imps|neft)\b/i, "BANK"],
];

export function methodSaid(text: string): PaymentMethod {
  return METHOD_WORDS.find(([pattern]) => pattern.test(text))?.[1] ?? "OTHER";
}

function titleSaid(title: string | null, question: string): string | null {
  const wanted = cleanTellText(title ?? "").slice(0, BILL_TITLE_MAX);
  if (wanted === "") return null;
  const at = question.toLowerCase().indexOf(wanted.toLowerCase());
  return at === -1 ? null : question.slice(at, at + wanted.length).trim() || null;
}

function amountSaid(amount: number | null, question: string): number | null {
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return null;
  return numbersSaid(question, 2).plain.has(amount) ? amount : null;
}

const unsupported = (ctx: AskContext, input: ProposeInput): Grounded => ({
  kind: "note",
  note: { kind: "unsupported", reason: "generic", bill: null, group: (groupAt(ctx, input.group) ?? ctx.account.scope)?.ref ?? null },
});

export function groundProposal(ctx: AskContext, question: string, input: ProposeInput): Grounded {
  const scope = groupAt(ctx, input.group) ?? ctx.account.scope;
  if (input.action === "addBill") {
    const group = scope ?? (ctx.account.groups.length === 1 ? ctx.account.groups[0] : undefined);
    return { kind: "note", note: { kind: "handoff", text: question, href: group ? routes.tellBill(group.id, undefined, question) : routes.newBill, carries: group !== undefined && group !== null } };
  }
  if (input.action === "other") return unsupported(ctx, input);
  if (input.action === "deleteBill" && !DELETE_WORDS.test(question)) return unsupported(ctx, input);

  const title = input.action === "renameBill" ? titleSaid(input.title, question) : null;
  if (input.action === "renameBill" && title === null) return unsupported(ctx, input);
  const billIds = [...new Set((input.bills ?? []).flatMap((ref) => ctx.found.get(ref)?.id ?? []))].slice(0, ACTION_BILLS_MAX);
  return {
    kind: "intent",
    intent: {
      ...EMPTY_INTENT,
      action: input.action,
      personId: personAt(ctx, input.person)?.id ?? null,
      secondId: personAt(ctx, input.second)?.id ?? null,
      groupId: scope?.id ?? null,
      billIds,
      direction: input.action === "recordPayment" ? input.direction : null,
      amount: amountSaid(input.amount, question),
      portion: input.whole ? "all" : null,
      method: methodSaid(question),
      title,
      date: input.action === "changeDate" ? dayOrNull(input.date) : null,
    },
  };
}
