import "server-only";
import type { z } from "zod";
import { routes } from "@/lib/auth/rules";
import { bucketTotals, spendLines, type SpendLine } from "@/lib/bills/spend";
import type { SpendBucket } from "@/lib/bills/buckets";
import type { PersonShare } from "@/lib/bills/types";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { billDay } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import type { BillTotalsEntry } from "@/lib/ledger/load";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { AskContext, AskGroup } from "../account";
import type { AskBill, AskCard, AskScope, AskSource, AskStep, AskToolName } from "../result";
import { ASK_NAME_MAX } from "../rules";

export type ToolSummary = Readonly<Record<string, unknown>>;

export interface ToolResult {
  readonly card: AskCard | null;
  readonly summary: ToolSummary;
}

export interface AskToolDef<Schema extends z.ZodType> {
  readonly name: AskToolName;
  readonly description: string;
  readonly inputSchema: Schema;
  readonly step: (ctx: AskContext, input: z.output<Schema>) => AskStep;
  readonly run: (ctx: AskContext, input: z.output<Schema>) => Promise<ToolResult> | ToolResult;
}

export function defineTool<Schema extends z.ZodType>(def: AskToolDef<Schema>): AskToolDef<Schema> {
  return def;
}

export const fail = (error: string, extra: ToolSummary = {}): ToolResult => ({ card: null, summary: { error, ...extra } });

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function dayOrNull(value: string | null): string | null {
  return value !== null && ISO_DAY.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00.000Z`)) ? value : null;
}

export function personAt(ctx: AskContext, index: number | null): PersonView | null {
  return index === null ? null : (ctx.account.people[index] ?? null);
}

export function groupAt(ctx: AskContext, index: number | null): AskGroup | null {
  return index === null ? null : (ctx.account.groups[index] ?? null);
}

export interface GroupPick {
  readonly groups: readonly AskGroup[];
  readonly all: boolean;
}

export function groupsFor(ctx: AskContext, indices: readonly number[] | null): GroupPick | null {
  if (indices === null || indices.length === 0) return { groups: ctx.account.groups, all: true };
  const picked = [...new Set(indices)].map((index) => groupAt(ctx, index));
  if (picked.some((group) => group === null)) return null;
  const groups = picked.flatMap((group) => (group ? [group] : []));
  return { groups, all: groups.length === ctx.account.groups.length };
}

export const nameOf = (person: PersonView | null) => (person ? person.displayName.slice(0, ASK_NAME_MAX) : null);

export const short = (text: string) => text.slice(0, ASK_NAME_MAX);

export const money = (amount: Cents, currency: CurrencyCode) => formatMoney(amount, currency);

export function stepOf(tool: AskToolName, parts: Partial<Omit<AskStep, "tool">> = {}): AskStep {
  return { tool, a: null, b: null, group: null, bucket: null, title: null, ...parts };
}

export function scopeOf(pick: GroupPick, bucket: SpendBucket | null, from: string | null, to: string | null): AskScope {
  return { groups: pick.groups.map((group) => group.ref), all: pick.all, bucket, from, to };
}

export function sourceOf(bills: number, payments: number, groups: readonly string[]): AskSource {
  return { bills, payments, groups: [...new Set(groups)] };
}

export function inRange(bill: BillTotalsEntry, from: string | null, to: string | null): boolean {
  const day = billDay(bill.occurredAt);
  return (from === null || day >= from) && (to === null || day <= to);
}

export function billsIn(ctx: AskContext, pick: GroupPick, from: string | null, to: string | null): BillTotalsEntry[] {
  const ids = new Set<string>(pick.groups.map((group) => group.id));
  return ctx.ledger.bills.filter((bill) => bill.groupId !== null && ids.has(bill.groupId) && inRange(bill, from, to));
}

const wholeShare = (total: Cents): PersonShare => ({ items: total, discount: ZERO_CENTS, tax: ZERO_CENTS, tip: ZERO_CENTS, total, lines: [] });

export function linesFor(ctx: AskContext, bill: BillTotalsEntry, who: PersonId | null): SpendLine[] {
  const spend = ctx.ledger.spend.get(bill.billId);
  if (!spend) return [];
  if (who === null) return spendLines(spend.items, wholeShare(bill.total), "EVEN");
  const share = spend.shares.get(who);
  return share ? spendLines(spend.items, share, spend.method) : [];
}

export function amountOf(lines: readonly SpendLine[], bucket: SpendBucket | null): Cents {
  return sumCents(lines.filter((line) => bucket === null || line.bucket === bucket).map((line) => line.amount));
}

export function mainBucket(ctx: AskContext, bill: BillTotalsEntry): SpendBucket | null {
  const lines = linesFor(ctx, bill, null);
  if (lines.length === 0 || lines.every((line) => !line.tagged)) return null;
  const totals = [...bucketTotals(lines.filter((line) => line.tagged))].sort((a, b) => b[1] - a[1]);
  return totals[0]?.[0] ?? null;
}

export function hasUntagged(ctx: AskContext, bill: BillTotalsEntry): boolean {
  const spend = ctx.ledger.spend.get(bill.billId);
  return !spend || spend.items.length === 0 || spend.items.some((item) => item.category === null);
}

export function toAskBill(ctx: AskContext, bill: BillTotalsEntry, share: Cents | null, bucket: SpendBucket | null): AskBill | null {
  const group = ctx.account.groups.find((g) => g.id === bill.groupId);
  const payer = ctx.everyone.get(bill.payerId);
  if (!group || !payer) return null;
  return {
    id: bill.billId,
    href: routes.bill(bill.slug),
    title: bill.title,
    group: group.ref,
    bucket: bucket ?? mainBucket(ctx, bill),
    payer,
    total: bill.total,
    currency: bill.currency,
    share,
    day: billDay(bill.occurredAt),
  };
}

export function byCurrency<T>(rows: readonly T[], currencyOf: (row: T) => CurrencyCode): Map<CurrencyCode, T[]> {
  const result = new Map<CurrencyCode, T[]>();
  for (const row of rows) result.set(currencyOf(row), [...(result.get(currencyOf(row)) ?? []), row]);
  return result;
}

export const total = (values: readonly number[]): Cents => cents(values.reduce((sum, value) => sum + value, 0));
