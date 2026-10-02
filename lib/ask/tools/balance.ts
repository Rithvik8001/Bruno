import "server-only";
import { z } from "zod";
import { routes } from "@/lib/auth/rules";
import type { CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import { debtKey } from "@/lib/ledger/allocation";
import { balancesWith, inScope, netBalances, type Debt, type SettlementEntry } from "@/lib/ledger/balances";
import { openLines, pairBalance } from "@/lib/ledger/pair";
import { countsTowardBalance } from "@/lib/ledger/settlements";
import { ZERO_CENTS, type Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { AskContext, AskGroup } from "../account";
import type { AskMoney, AskPayment, BalanceCard, BalanceLine, BalanceOpenLine, BalanceTotal, RankCard, RankRow } from "../result";
import { ASK_ROWS_MAX } from "../rules";
import { defineTool, fail, groupsFor, money, nameOf, personAt, scopeOf, short, sourceOf, stepOf, toAskBill, total, type GroupPick, type ToolResult } from "./shared";

const TITLES = 2;

const inputSchema = z.object({
  a: z.number().int().nullable().describe("Person index, or null for every member"),
  b: z.number().int().nullable().describe("Second person index, or null for everyone a shares bills with"),
  groups: z.array(z.number().int()).nullable().describe("Group indexes, or null for all groups"),
});

const between = (a: PersonId, b: PersonId) => (entry: { from: PersonId; to: PersonId }) =>
  (entry.from === a && entry.to === b) || (entry.from === b && entry.to === a);

function nonZero(nets: ReadonlyMap<CurrencyCode, number>): AskMoney[] {
  return [...nets].filter(([, amount]) => amount !== 0).map(([currency, amount]) => ({ currency, amount: total([amount]) }));
}

function overallOf(ctx: AskContext, a: PersonId, b: PersonId): AskMoney[] {
  const all = balancesWith(a, ctx.ledger.debts, ctx.ledger.settlements, ctx.now);
  return nonZero(new Map([...all].map(([currency, byPerson]) => [currency, byPerson.get(b) ?? ZERO_CENTS])));
}

function lastPaymentOf(ctx: AskContext, groups: readonly AskGroup[], settlements: readonly SettlementEntry[]): AskPayment | null {
  const dated = settlements
    .flatMap((s) => {
      const facts = ctx.ledger.payments.get(s.id);
      return facts && countsTowardBalance(s, ctx.now) ? [{ s, facts }] : [];
    })
    .sort((x, y) => y.facts.at.getTime() - x.facts.at.getTime());
  const latest = dated[0];
  if (!latest) return null;
  const from = ctx.everyone.get(latest.s.from);
  const to = ctx.everyone.get(latest.s.to);
  const group = groups.find((g) => g.id === latest.s.groupId);
  if (!from || !to || !group) return null;
  return { from, to, amount: latest.s.amount, currency: latest.s.currency, at: latest.facts.at.toISOString(), group: group.ref };
}

function openOf(ctx: AskContext, a: PersonView, b: PersonView, line: BalanceLine, group: AskGroup): BalanceOpenLine[] {
  const debtor = line.net > 0 ? b.id : a.id;
  const creditor = line.net > 0 ? a.id : b.id;
  const titles = new Map(ctx.ledger.bills.map((bill) => [bill.billId, bill.title]));
  return openLines(ctx.ledger.debts, ctx.view.remaining, titles, debtor, creditor, { groupId: group.id, currency: group.currency }).flatMap((open) => {
    const entry = ctx.billsById.get(open.billId);
    const bill = entry ? toAskBill(ctx, entry, entry.shares.get(debtor) ?? ZERO_CENTS, null) : null;
    return bill ? [{ bill, left: open.amount }] : [];
  });
}

function pair(ctx: AskContext, a: PersonView, b: PersonView, pick: GroupPick): ToolResult {
  const isBetween = between(a.id, b.id);
  const mine = a.id === ctx.account.you;
  const perGroup = pick.groups.flatMap((group) => {
    const debts = inScope(ctx.ledger.debts, group.id).filter(isBetween);
    const settlements = inScope(ctx.ledger.settlements, group.id).filter(isBetween);
    if (debts.length === 0 && settlements.length === 0) return [];
    const net = pairBalance(a.id, b.id, ctx.ledger.debts, ctx.ledger.settlements, { groupId: group.id, currency: group.currency }, ctx.now);
    const open = debts.filter((debt) => (ctx.view.remaining.get(debtKey(debt)) ?? ZERO_CENTS) > 0);
    const titles = [...new Set(open.map((debt: Debt) => ctx.billsById.get(debt.billId)?.title ?? ""))].filter(Boolean).slice(0, TITLES);
    const line: BalanceLine = {
      group: group.ref,
      currency: group.currency,
      net,
      titles,
      bills: new Set(debts.map((debt) => debt.billId)).size,
      settleHref: mine && net !== 0 ? routes.settle(group.id, b.id, ctx.backHref) : null,
    };
    return [{ group, line, settlements }];
  });

  const lines = perGroup.map((entry) => entry.line);
  const nets = new Map<CurrencyCode, { net: number; groups: string[] }>();
  for (const line of lines) {
    if (line.net === 0) continue;
    const current = nets.get(line.currency) ?? { net: 0, groups: [] };
    nets.set(line.currency, { net: current.net + line.net, groups: [...current.groups, line.group.name] });
  }
  const totals: BalanceTotal[] = [...nets].filter(([, value]) => value.net !== 0).map(([currency, value]) => ({ currency, net: total([value.net]), groups: value.groups }));
  const owing = perGroup.filter((entry) => entry.line.net !== 0);
  const only = owing.length === 1 ? owing[0] : undefined;
  const settlements = perGroup.flatMap((entry) => entry.settlements);

  const card: BalanceCard = {
    kind: "balance",
    subject: a,
    other: b,
    mine,
    all: pick.all,
    totals,
    lines,
    open: only ? openOf(ctx, a, b, only.line, only.group) : null,
    lastPayment: lastPaymentOf(ctx, pick.groups, settlements),
    overall: pick.all ? null : overallOf(ctx, a.id, b.id),
    source: sourceOf(
      lines.reduce((sum, line) => sum + line.bills, 0),
      settlements.filter((s) => countsTowardBalance(s, ctx.now)).length,
      lines.map((line) => line.group.name),
    ),
  };
  return {
    card,
    summary: {
      between: [nameOf(a), nameOf(b)],
      note: "positive net = the second person owes the first",
      perGroup: lines.map((line) => ({ group: short(line.group.name), net: money(line.net, line.currency) })),
      totals: totals.map((t) => money(t.net, t.currency)),
      allSquare: totals.length === 0,
    },
  };
}

function withEveryone(ctx: AskContext, a: PersonView, pick: GroupPick): ToolResult {
  const ids = new Set<string>(pick.groups.map((group) => group.id));
  const debts = ctx.ledger.debts.filter((debt) => debt.groupId !== null && ids.has(debt.groupId));
  const settlements = ctx.ledger.settlements.filter((s) => s.groupId !== null && ids.has(s.groupId));
  const balances = balancesWith(a.id, debts, settlements, ctx.now);
  const mine = a.id === ctx.account.you;
  const single = pick.groups.length === 1 ? pick.groups[0] : undefined;
  const rows: RankRow[] = [...balances]
    .flatMap(([currency, byPerson]) =>
      [...byPerson].flatMap(([id, amount]): RankRow[] => {
        const person = ctx.everyone.get(id);
        if (!person || amount === 0) return [];
        const isBetween = between(a.id, id);
        return [
          {
            person,
            group: null,
            amount,
            currency,
            bills: new Set(debts.filter(isBetween).map((debt) => debt.billId)).size,
            href: mine && single ? routes.settle(single.id, id, ctx.backHref) : null,
          },
        ];
      }),
    )
    .sort((x, y) => Math.abs(y.amount) - Math.abs(x.amount))
    .slice(0, ASK_ROWS_MAX);
  const totals = nonZero(new Map([...balances].map(([currency, byPerson]) => [currency, [...byPerson.values()].reduce<number>((sum, v) => sum + v, 0)])));
  const card: RankCard = {
    kind: "rank",
    metric: "balance",
    by: "person",
    subject: a,
    mine,
    scope: scopeOf(pick, null, null, null),
    totals,
    rows,
    source: sourceOf(new Set(debts.filter((debt) => debt.from === a.id || debt.to === a.id).map((debt) => debt.billId)).size, 0, pick.groups.map((g) => g.ref.name)),
  };
  return {
    card,
    summary: {
      person: nameOf(a),
      note: "positive = they owe this person",
      rows: rows.map((row) => ({ with: nameOf(row.person), net: money(row.amount, row.currency) })),
      totals: totals.map((t) => money(t.amount, t.currency)),
    },
  };
}

function everyoneNet(ctx: AskContext, pick: GroupPick): ToolResult {
  const ids = new Set<string>(pick.groups.map((group) => group.id));
  const debts = ctx.ledger.debts.filter((debt) => debt.groupId !== null && ids.has(debt.groupId));
  const settlements = ctx.ledger.settlements.filter((s) => s.groupId !== null && ids.has(s.groupId));
  const rows: RankRow[] = [...netBalances(debts, settlements, ctx.now)]
    .flatMap(([currency, byPerson]) =>
      [...byPerson].flatMap(([id, amount]: [PersonId, Cents]): RankRow[] => {
        const person = ctx.everyone.get(id);
        return person && amount !== 0 ? [{ person, group: null, amount, currency, bills: 0, href: null }] : [];
      }),
    )
    .sort((x, y) => y.amount - x.amount)
    .slice(0, ASK_ROWS_MAX);
  const card: RankCard = {
    kind: "rank",
    metric: "net",
    by: "person",
    subject: null,
    mine: false,
    scope: scopeOf(pick, null, null, null),
    totals: [],
    rows,
    source: sourceOf(new Set(debts.map((debt) => debt.billId)).size, 0, pick.groups.map((g) => g.ref.name)),
  };
  return {
    card,
    summary: { note: "positive = is owed money overall, negative = owes", rows: rows.map((row) => ({ person: nameOf(row.person), net: money(row.amount, row.currency) })) },
  };
}

export const balanceTool = defineTool({
  name: "balance",
  description:
    "Who owes whom right now. a and b: what the two people owe each other, per group and currency. Only a: a's balance with each person. Neither: every member's net balance in the groups.",
  inputSchema,
  step: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    const only = pick && pick.groups.length === 1 ? pick.groups[0] : undefined;
    return stepOf("balance", { a: nameOf(personAt(ctx, input.a)), b: nameOf(personAt(ctx, input.b)), group: only?.ref.name ?? null });
  },
  run: (ctx, input) => {
    const pick = groupsFor(ctx, input.groups);
    if (!pick) return fail("unknown group index");
    const a = personAt(ctx, input.a);
    const b = personAt(ctx, input.b);
    if (input.a !== null && !a) return fail("unknown person index a");
    if (input.b !== null && !b) return fail("unknown person index b");
    if (a && b) return a.id === b.id ? fail("a and b are the same person") : pair(ctx, a, b, pick);
    const one = a ?? b;
    return one ? withEveryone(ctx, one, pick) : everyoneNet(ctx, pick);
  },
});
