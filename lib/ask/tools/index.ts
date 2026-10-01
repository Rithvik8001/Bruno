import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { routes } from "@/lib/auth/rules";
import { inScope } from "@/lib/ledger/balances";
import { pairBalance } from "@/lib/ledger/pair";
import type { AskContext } from "../account";
import { ASK_PERIODS, ASK_SLOTS, type AskCard, type AskClarifyQuestion, type AskPeriod, type AskToolName, type DeclineCard } from "../result";
import { ASK_CLARIFY_MAX, ASK_CLARIFY_OPTIONS_MAX, ASK_DECLINE_REASONS } from "../rules";
import { balanceTool } from "./balance";
import { billsTool } from "./bills";
import { explainTool } from "./explain";
import { findBillsTool } from "./find";
import { historyTool } from "./history";
import { groupAt, personAt, type AskToolDef } from "./shared";
import { spendingTool } from "./spending";

export const TERMINAL_TOOLS = ["answer", "clarify", "decline"] as const;

export type AskTerminal =
  | { readonly kind: "answer"; readonly card: AskCard }
  | { readonly kind: "clarify"; readonly questions: readonly AskClarifyQuestion[] }
  | { readonly kind: "decline"; readonly card: DeclineCard };

export interface AskCall {
  readonly tool: AskToolName;
  readonly ref: string | null;
}

export interface AskToolkit {
  readonly tools: ReturnType<typeof buildTools>;
  readonly terminal: () => AskTerminal | null;
  readonly calls: () => readonly AskCall[];
}

interface Holder {
  terminal: AskTerminal | null;
  readonly calls: AskCall[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function periodRange(period: AskPeriod, today: string): { from: string | null; to: string | null } {
  if (period === "all") return { from: null, to: null };
  const [year = 0, month = 1] = today.split("-").map(Number);
  const back = period === "thisMonth" ? 0 : period === "lastMonth" ? 1 : 2;
  const start = new Date(Date.UTC(year, month - 1 - back, 1));
  const end = new Date(Date.UTC(year, month - back, 0));
  const iso = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  return { from: iso(start), to: period === "thisMonth" ? today : iso(end) };
}

function data<Schema extends z.ZodType>(ctx: AskContext, holder: Holder, def: AskToolDef<Schema>) {
  return tool({
    description: def.description,
    inputSchema: def.inputSchema,
    execute: async (input: z.output<Schema>) => {
      ctx.emit(def.step(ctx, input));
      const result = await def.run(ctx, input);
      if (!result.card) {
        holder.calls.push({ tool: def.name, ref: null });
        return result.summary;
      }
      const ref = `r${ctx.cards.size + 1}`;
      ctx.cards.set(ref, result.card);
      holder.calls.push({ tool: def.name, ref });
      return { ref, card: result.card.kind, ...result.summary };
    },
  });
}

const answerSchema = z.object({ show: z.string().describe("The ref of the tool result to show, like r1") });

const clarifySchema = z.object({
  questions: z
    .array(
      z.object({
        slot: z.enum(ASK_SLOTS),
        options: z.array(z.number().int()).describe("Person or group indexes to choose between. Empty for period"),
      }),
    )
    .min(1)
    .max(ASK_CLARIFY_MAX),
});

const declineSchema = z.object({
  reason: z.enum(ASK_DECLINE_REASONS),
  person: z.number().int().nullable().describe("Person index the request was about, if any"),
  group: z.number().int().nullable().describe("Group index the request was about, if any"),
});

function clarifyQuestion(ctx: AskContext, slot: (typeof ASK_SLOTS)[number], options: readonly number[]): AskClarifyQuestion | null {
  const unique = [...new Set(options)].slice(0, ASK_CLARIFY_OPTIONS_MAX);
  if (slot === "period") {
    return { slot, options: ASK_PERIODS.map((ref) => ({ ref, ...periodRange(ref, ctx.today) })) };
  }
  if (slot === "person") {
    const people = unique.flatMap((index) => {
      const person = personAt(ctx, index);
      if (!person || person.id === ctx.account.you) return [];
      const groups = ctx.account.groups.filter((group) => group.members.includes(person.id));
      const shared = ctx.ledger.debts.filter((debt) => debt.from === person.id || debt.to === person.id).length;
      return [{ ref: person.id as string, person, groups: groups.map((group) => group.ref.name), shared }];
    });
    if (people.length < 2) return null;
    return { slot, options: people.sort((a, b) => b.shared - a.shared).map(({ ref, person, groups }) => ({ ref, person, groups })) };
  }
  const groups = unique.flatMap((index) => {
    const group = groupAt(ctx, index);
    return group ? [{ ref: group.id as string, group: group.ref, bills: inScope(ctx.ledger.bills, group.id).length, currency: group.currency }] : [];
  });
  return groups.length < 2 ? null : { slot, options: groups.sort((a, b) => b.bills - a.bills) };
}

function declineCard(ctx: AskContext, input: z.output<typeof declineSchema>): DeclineCard {
  const person = personAt(ctx, input.person);
  const group = groupAt(ctx, input.group);
  const you = ctx.account.you;
  const owing =
    input.reason === "wantsChange" && person && person.id !== you
      ? (group ? [group] : ctx.account.groups).find(
          (g) => pairBalance(you, person.id, ctx.ledger.debts, ctx.ledger.settlements, { groupId: g.id, currency: g.currency }, ctx.now) !== 0,
        )
      : undefined;
  return {
    kind: "decline",
    reason: input.reason,
    person: person && person.id !== you ? person : null,
    group: group?.ref ?? null,
    settleHref: owing && person ? routes.settle(owing.id, person.id, ctx.backHref) : null,
  };
}

function buildTools(ctx: AskContext, holder: Holder, allowClarify: boolean) {
  const base = {
    balance: data(ctx, holder, balanceTool),
    explain: data(ctx, holder, explainTool),
    spending: data(ctx, holder, spendingTool),
    bills: data(ctx, holder, billsTool),
    findBills: data(ctx, holder, findBillsTool),
    history: data(ctx, holder, historyTool),
    answer: tool({
      description: "Finish by showing one tool result to the user. Call this once you have the result that answers the question.",
      inputSchema: answerSchema,
      execute: async ({ show }: z.output<typeof answerSchema>) => {
        const card = ctx.cards.get(show) ?? [...ctx.cards.values()].at(-1);
        if (card) holder.terminal = { kind: "answer", card };
        return { done: card !== undefined };
      },
    }),
    decline: tool({
      description:
        "Finish without an answer. outOfScope: not about this account's bills, balances, spending, payments or history. notYourGroup: about a group or person that is not in the account. wantsChange: asks to add, edit, delete, settle, pay or remind.",
      inputSchema: declineSchema,
      execute: async (input: z.output<typeof declineSchema>) => {
        holder.terminal = { kind: "decline", card: declineCard(ctx, input) };
        return { done: true };
      },
    }),
  };
  if (!allowClarify) return base;
  return {
    ...base,
    clarify: tool({
      description:
        "Finish by asking the user to pick. Only when two people or two groups genuinely match the question, or a time period is needed and not implied. Never for anything else.",
      inputSchema: clarifySchema,
      execute: async ({ questions }: z.output<typeof clarifySchema>) => {
        const built = questions.flatMap((question) => {
          const made = clarifyQuestion(ctx, question.slot, question.options);
          return made ? [made] : [];
        });
        if (built.length > 0) holder.terminal = { kind: "clarify", questions: built };
        return { done: built.length > 0 };
      },
    }),
  };
}

export function askToolkit(ctx: AskContext, allowClarify: boolean): AskToolkit {
  const holder: Holder = { terminal: null, calls: [] };
  return { tools: buildTools(ctx, holder, allowClarify), terminal: () => holder.terminal, calls: () => holder.calls };
}
