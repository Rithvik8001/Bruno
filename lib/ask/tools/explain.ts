import "server-only";
import { z } from "zod";
import { routes } from "@/lib/auth/rules";
import type { PersonId } from "@/lib/domain/ids";
import { inScope } from "@/lib/ledger/balances";
import { pairHistory, type PairEntry } from "@/lib/ledger/history";
import { ZERO_CENTS } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { AskContext, AskGroup } from "../account";
import type { EmptyCard, WhyCard, WhyEntry } from "../result";
import { ASK_HISTORY_MAX } from "../rules";
import { defineTool, fail, groupAt, groupsFor, money, nameOf, personAt, scopeOf, short, sourceOf, stepOf, toAskBill, type ToolResult } from "./shared";

const inputSchema = z.object({
  a: z.number().int().describe("Person index, usually the user"),
  b: z.number().int().describe("The other person index"),
  group: z.number().int().nullable().describe("Group index. null lets the app pick when only one group has a balance"),
});

function candidates(ctx: AskContext, a: PersonId, b: PersonId): AskGroup[] {
  const between = (entry: { from: PersonId; to: PersonId }) => (entry.from === a && entry.to === b) || (entry.from === b && entry.to === a);
  return ctx.account.groups.filter(
    (group) => inScope(ctx.ledger.debts, group.id).some(between) || inScope(ctx.ledger.settlements, group.id).some(between),
  );
}

function toEntry(ctx: AskContext, entry: PairEntry, group: AskGroup, a: PersonView, b: PersonView): WhyEntry | null {
  if (entry.kind === "payment") {
    const facts = ctx.ledger.payments.get(entry.settlementId);
    const settlement = ctx.ledger.settlements.find((s) => s.id === entry.settlementId);
    if (!facts || !settlement) return null;
    const from = entry.from === a.id ? a : b;
    const to = entry.from === a.id ? b : a;
    return {
      kind: "payment",
      payment: { from, to, amount: settlement.amount, currency: settlement.currency, at: facts.at.toISOString(), group: group.ref },
      delta: entry.delta,
      running: entry.running,
    };
  }
  const bill = ctx.billsById.get(entry.billId);
  if (!bill) return null;
  const debtor = entry.delta > 0 ? b.id : a.id;
  const view = toAskBill(ctx, bill, bill.shares.get(debtor) ?? ZERO_CENTS, null);
  return view ? { kind: "bill", bill: view, delta: entry.delta, running: entry.running } : null;
}

function explain(ctx: AskContext, a: PersonView, b: PersonView, group: AskGroup): ToolResult {
  const history = pairHistory(
    a.id,
    b.id,
    ctx.ledger.debts,
    ctx.ledger.settlements,
    new Map([...ctx.ledger.payments].map(([id, facts]) => [id, facts.at])),
    { groupId: group.id, currency: group.currency },
    ctx.now,
  );
  const pick = { groups: [group], all: ctx.account.groups.length === 1 };
  if (history.entries.length === 0) {
    const card: EmptyCard = { kind: "empty", about: "balance", scope: scopeOf(pick, null, null, null), checked: inScope(ctx.ledger.bills, group.id).length, other: b, title: null };
    return { card, summary: { empty: true, note: `${nameOf(a)} and ${nameOf(b)} share no bills in ${short(group.ref.name)}` } };
  }
  const cut = Math.max(0, history.entries.length - ASK_HISTORY_MAX);
  const before = cut > 0 ? history.entries[cut - 1] : undefined;
  const entries = history.entries.slice(cut).flatMap((entry) => {
    const mapped = toEntry(ctx, entry, group, a, b);
    return mapped ? [mapped] : [];
  });
  const mine = a.id === ctx.account.you;
  const card: WhyCard = {
    kind: "why",
    subject: a,
    other: b,
    mine,
    group: group.ref,
    currency: group.currency,
    net: history.net,
    entries,
    earlier: before ? { count: cut, running: before.running } : null,
    settleHref: mine && history.net !== 0 ? routes.settle(group.id, b.id, ctx.backHref) : null,
    source: sourceOf(
      history.entries.filter((entry) => entry.kind === "bill").length,
      history.entries.filter((entry) => entry.kind === "payment").length,
      [group.ref.name],
    ),
  };
  return {
    card,
    summary: {
      between: [nameOf(a), nameOf(b)],
      group: short(group.ref.name),
      net: money(history.net, group.currency),
      note: "positive net = the second person owes the first",
      entries: history.entries.length,
    },
  };
}

export const explainTool = defineTool({
  name: "explain",
  description:
    "Why a balance between two people is what it is: every bill and payment between them in one group, oldest first, with a running total. Use for 'why do I owe X'.",
  inputSchema,
  step: (ctx, input) => stepOf("explain", { a: nameOf(personAt(ctx, input.a)), b: nameOf(personAt(ctx, input.b)), group: groupAt(ctx, input.group)?.ref.name ?? null }),
  run: (ctx, input) => {
    const a = personAt(ctx, input.a);
    const b = personAt(ctx, input.b);
    if (!a || !b) return fail("unknown person index");
    if (a.id === b.id) return fail("a and b are the same person");
    if (input.group !== null) {
      const group = groupAt(ctx, input.group);
      return group ? explain(ctx, a, b, group) : fail("unknown group index");
    }
    const shared = candidates(ctx, a.id, b.id);
    const scoped = ctx.account.scope ? shared.find((group) => group.id === ctx.account.scope?.id) : undefined;
    const only = scoped ?? (shared.length === 1 ? shared[0] : undefined);
    if (only) return explain(ctx, a, b, only);
    if (shared.length === 0) {
      const pick = groupsFor(ctx, null);
      const card: EmptyCard = {
        kind: "empty",
        about: "balance",
        scope: scopeOf(pick ?? { groups: [], all: true }, null, null, null),
        checked: ctx.ledger.bills.length,
        other: b,
        title: null,
      };
      return { card, summary: { empty: true, note: `${nameOf(a)} and ${nameOf(b)} share no bills` } };
    }
    return fail("more than one group has bills between them: pass group, picking the one whose balance matches the question, or clarify", {
      groups: shared.map((group) => ({ index: group.index, name: short(group.ref.name) })),
    });
  },
});
