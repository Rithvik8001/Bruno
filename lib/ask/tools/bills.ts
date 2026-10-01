import "server-only";
import { z } from "zod";
import { SPEND_BUCKETS } from "@/lib/bills/buckets";
import { ZERO_CENTS } from "@/lib/money";
import type { AskBill, EmptyCard, ListCard, ListTotal } from "../result";
import { ASK_BILLS_MAX } from "../rules";
import { amountOf, billsIn, byCurrency, dayOrNull, defineTool, fail, groupsFor, linesFor, money, nameOf, personAt, scopeOf, short, sourceOf, stepOf, toAskBill, total } from "./shared";

const inputSchema = z.object({
  groups: z.array(z.number().int()).nullable().describe("Group indexes, or null for all groups"),
  payer: z.number().int().nullable().describe("Only bills this person paid for, or null"),
  involving: z.number().int().nullable().describe("Only bills this person has a share in, or null"),
  bucket: z.enum(SPEND_BUCKETS).nullable().describe("Only bills with this kind of spending, or null"),
  from: z.string().nullable().describe("First day, YYYY-MM-DD, or null"),
  to: z.string().nullable().describe("Last day, YYYY-MM-DD, or null"),
  title: z.string().nullable().describe("Words from the bill's name, or null"),
});

const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 1);

export const billsTool = defineTool({
  name: "bills",
  description: "List bills that match: who paid, who was involved, kind of spending, dates, name. Returns the count and total per currency.",
  inputSchema,
  step: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    const only = pick && pick.groups.length === 1 ? pick.groups[0] : undefined;
    return stepOf("bills", { a: nameOf(personAt(ctx, input.payer ?? input.involving)), group: only?.ref.name ?? null, bucket: input.bucket, title: input.title ? short(input.title) : null });
  },
  run: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    if (!pick) return fail("unknown group index");
    const payer = personAt(ctx, input.payer);
    const involving = personAt(ctx, input.involving);
    if ((input.payer !== null && !payer) || (input.involving !== null && !involving)) return fail("unknown person index");
    const from = dayOrNull(input.from);
    const to = dayOrNull(input.to);
    const wanted = input.title ? words(input.title) : [];
    const inScope = billsIn(ctx, pick, from, to);
    const matched = inScope.filter((bill) => {
      if (payer && bill.payerId !== payer.id) return false;
      if (involving && bill.payerId !== involving.id && (bill.shares.get(involving.id) ?? ZERO_CENTS) <= 0) return false;
      if (input.bucket !== null && amountOf(linesFor(ctx, bill, null), input.bucket) <= 0) return false;
      const title = bill.title.toLowerCase();
      return wanted.every((word) => title.includes(word));
    });
    const filter = { ...scopeOf(pick, input.bucket, from, to), payer, involving, title: input.title ? short(input.title) : null };
    if (matched.length === 0) {
      const card: EmptyCard = { kind: "empty", about: "list", scope: filter, checked: inScope.length, other: payer ?? involving, title: filter.title };
      return { card, summary: { empty: true, checkedBills: inScope.length } };
    }
    const totals: ListTotal[] = [...byCurrency(matched, (bill) => bill.currency)].map(([currency, list]) => ({
      currency,
      amount: total(list.map((bill) => bill.total)),
      bills: list.length,
      groups: [...new Set(list.map((bill) => pick.groups.find((group) => group.id === bill.groupId)?.ref.name ?? ""))].filter(Boolean),
    }));
    const rows: AskBill[] = matched.slice(0, ASK_BILLS_MAX).flatMap((bill) => {
      const view = toAskBill(ctx, bill, bill.shares.get(ctx.account.you) ?? ZERO_CENTS, input.bucket);
      return view ? [view] : [];
    });
    const card: ListCard = {
      kind: "list",
      filter,
      totals,
      bills: rows,
      billCount: matched.length,
      source: sourceOf(matched.length, 0, totals.flatMap((t) => t.groups)),
    };
    return {
      card,
      summary: {
        count: matched.length,
        totals: totals.map((t) => ({ total: money(t.amount, t.currency), bills: t.bills })),
        first: rows.slice(0, 5).map((bill) => ({ title: short(bill.title), day: bill.day, total: money(bill.total, bill.currency) })),
      },
    };
  },
});
