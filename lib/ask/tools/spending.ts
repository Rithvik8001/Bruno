import "server-only";
import { z } from "zod";
import { routes } from "@/lib/auth/rules";
import { SPEND_BUCKETS, type SpendBucket } from "@/lib/bills/buckets";
import type { CurrencyCode } from "@/lib/currency";
import { billDay } from "@/lib/dates";
import type { BillTotalsEntry } from "@/lib/ledger/load";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { AskContext } from "../account";
import type { AskBill, AskMoney, EmptyCard, RankCard, RankRow, SpendBreakdown, SpendCard, SpendTotal } from "../result";
import { ASK_MONTHS, ASK_ROWS_MAX, ASK_TOP_BILLS } from "../rules";
import {
  amountOf,
  billsIn,
  byCurrency,
  dayOrNull,
  defineTool,
  fail,
  groupsFor,
  hasUntagged,
  linesFor,
  money,
  nameOf,
  personAt,
  scopeOf,
  sourceOf,
  stepOf,
  toAskBill,
  total,
  type GroupPick,
  type ToolResult,
} from "./shared";

const FILTERED_BILLS = 5;
const BREAKDOWNS = ["bucket", "month", "person", "group"] as const;

const inputSchema = z.object({
  groups: z.array(z.number().int()).nullable().describe("Group indexes, or null for all groups"),
  bucket: z.enum(SPEND_BUCKETS).nullable().describe("Only this kind of spending, or null for everything"),
  from: z.string().nullable().describe("First day, YYYY-MM-DD, or null"),
  to: z.string().nullable().describe("Last day, YYYY-MM-DD, or null"),
  who: z.number().int().nullable().describe("Person index for that person's share, or null for what the whole group spent"),
  by: z.enum(BREAKDOWNS).nullable().describe("Break the total down by bucket, month, person or group. null picks a sensible default"),
});

type Input = z.output<typeof inputSchema>;

interface Row {
  readonly bill: BillTotalsEntry;
  readonly amount: Cents;
  readonly groupTotal: Cents;
  readonly yours: Cents;
}

function rowsOf(ctx: AskContext, bills: readonly BillTotalsEntry[], who: PersonView | null, bucket: SpendBucket | null): Row[] {
  return bills.flatMap((bill) => {
    const whole = amountOf(linesFor(ctx, bill, null), bucket);
    const yours = amountOf(linesFor(ctx, bill, ctx.account.you), bucket);
    const amount = who === null ? whole : who.id === ctx.account.you ? yours : amountOf(linesFor(ctx, bill, who.id), bucket);
    return amount > 0 ? [{ bill, amount, groupTotal: whole, yours }] : [];
  });
}

function monthsBack(end: string, count: number): string[] {
  const [year = 0, month = 1] = end.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return date.toISOString().slice(0, 7);
  });
}

function breakdownOf(ctx: AskContext, input: Input, pick: GroupPick, rows: readonly Row[], who: PersonView | null, currency: CurrencyCode, from: string | null, to: string | null): SpendBreakdown | null {
  if (input.by === "month") {
    const months = monthsBack((to ?? ctx.today).slice(0, 7), ASK_MONTHS);
    const everything = rowsOf(ctx, billsIn(ctx, pick, null, null), who, input.bucket).filter((row) => row.bill.currency === currency);
    return {
      by: "month",
      currency,
      parts: months.map((month) => ({
        month,
        amount: total(everything.filter((row) => billDay(row.bill.occurredAt).startsWith(month)).map((row) => row.amount)),
        on: (from === null || month >= from.slice(0, 7)) && (to === null || month <= to.slice(0, 7)),
      })),
    };
  }
  if (input.bucket !== null) return null;
  const parts = SPEND_BUCKETS.map((bucket) => ({
    bucket,
    amount: total(rows.map((row) => amountOf(linesFor(ctx, row.bill, who ? who.id : null), bucket))),
  })).filter((part) => part.amount > 0);
  return parts.length > 1 ? { by: "bucket", currency, parts: parts.sort((a, b) => b.amount - a.amount) } : null;
}

function rank(ctx: AskContext, input: Input, pick: GroupPick, bills: readonly BillTotalsEntry[], who: PersonView | null, from: string | null, to: string | null): ToolResult {
  const rows: RankRow[] =
    input.by === "person"
      ? [...ctx.everyone.values()].flatMap((person) =>
          [...byCurrency(rowsOf(ctx, bills, person, input.bucket), (row) => row.bill.currency)].map(([currency, list]) => ({
            person,
            group: null,
            amount: total(list.map((row) => row.amount)),
            currency,
            bills: list.length,
            href: null,
          })),
        )
      : pick.groups.flatMap((group) => {
          const list = rowsOf(
            ctx,
            bills.filter((bill) => bill.groupId === group.id),
            who,
            input.bucket,
          );
          return list.length === 0
            ? []
            : [{ person: null, group: group.ref, amount: total(list.map((row) => row.amount)), currency: group.currency, bills: list.length, href: routes.group(group.id) }];
        });
  const sorted = rows.sort((a, b) => b.amount - a.amount).slice(0, ASK_ROWS_MAX);
  const totals: AskMoney[] = [...byCurrency(sorted, (row) => row.currency)].map(([currency, list]) => ({ currency, amount: total(list.map((row) => row.amount)) }));
  const card: RankCard = {
    kind: "rank",
    metric: "spend",
    by: input.by === "person" ? "person" : "group",
    subject: who,
    mine: who?.id === ctx.account.you,
    scope: scopeOf(pick, input.bucket, from, to),
    totals,
    rows: sorted,
    source: sourceOf(bills.length, 0, pick.groups.map((group) => group.ref.name)),
  };
  return {
    card,
    summary: {
      by: card.by,
      rows: sorted.map((row) => ({ name: row.person ? nameOf(row.person) : row.group?.name, amount: money(row.amount, row.currency), bills: row.bills })),
    },
  };
}

export const spendingTool = defineTool({
  name: "spending",
  description:
    "How much was spent. who = a person's share (what it cost them), or null for the whole group's total. Filter by groups, kind of spending and dates. by: bucket (default), month, person (who spent most), group (which group cost most).",
  inputSchema,
  step: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    const only = pick && pick.groups.length === 1 ? pick.groups[0] : undefined;
    return stepOf("spending", { a: nameOf(personAt(ctx, input.who)), group: only?.ref.name ?? null, bucket: input.bucket });
  },
  run: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    if (!pick) return fail("unknown group index");
    const who = personAt(ctx, input.who);
    if (input.who !== null && !who) return fail("unknown person index");
    const from = dayOrNull(input.from);
    const to = dayOrNull(input.to);
    const bills = billsIn(ctx, pick, from, to);
    const scope = scopeOf(pick, input.bucket, from, to);
    if (input.by === "person" || input.by === "group") return rank(ctx, input, pick, bills, who, from, to);

    const rows = rowsOf(ctx, bills, who, input.bucket);
    if (rows.length === 0) {
      const card: EmptyCard = { kind: "empty", about: "spend", scope, checked: bills.length, other: null, title: null };
      return { card, summary: { empty: true, checkedBills: bills.length, note: "nothing matched. Try another bucket or a wider range, or show this." } };
    }
    const grouped = byCurrency(rows, (row) => row.bill.currency);
    const totals: SpendTotal[] = [...grouped].map(([currency, list]) => ({
      currency,
      amount: total(list.map((row) => row.amount)),
      groupTotal: total(list.map((row) => row.groupTotal)),
      yourShare: total(list.map((row) => row.yours)),
      bills: list.length,
      groups: [...new Set(list.map((row) => pick.groups.find((group) => group.id === row.bill.groupId)?.ref.name ?? ""))].filter(Boolean),
    }));
    const single = totals.length === 1 ? totals[0] : undefined;
    const limit = input.bucket === null && input.by !== "month" ? ASK_TOP_BILLS : FILTERED_BILLS;
    const ordered = input.by === "month" ? rows : [...rows].sort((a, b) => b.amount - a.amount);
    const top: AskBill[] = ordered.slice(0, limit).flatMap((row) => {
      const bill = toAskBill(ctx, row.bill, who === null ? row.yours : row.amount, input.bucket);
      return bill ? [bill] : [];
    });
    const onlyGroup = pick.groups.length === 1 ? pick.groups[0] : undefined;
    const card: SpendCard = {
      kind: "spend",
      whose: who,
      mine: who?.id === ctx.account.you,
      scope,
      totals,
      breakdown: single ? breakdownOf(ctx, input, pick, rows, who, single.currency, from, to) : null,
      bills: top,
      billCount: rows.length,
      moreHref: onlyGroup && rows.length > top.length ? routes.group(onlyGroup.id) : null,
      untagged: rows.filter((row) => hasUntagged(ctx, row.bill)).length,
      source: sourceOf(rows.length, 0, totals.flatMap((t) => t.groups)),
    };
    return {
      card,
      summary: {
        whose: who ? nameOf(who) : "whole group",
        bucket: input.bucket ?? "everything",
        totals: totals.map((t) => ({ amount: money(t.amount, t.currency), groupTotal: money(t.groupTotal, t.currency), bills: t.bills, groups: t.groups })),
        breakdown: card.breakdown?.by ?? null,
      },
    };
  },
});
