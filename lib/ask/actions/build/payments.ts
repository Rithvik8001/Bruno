import "server-only";
import { toGroupRef } from "@/lib/bills/queries";
import { isCurrencyCode, minorUnitsOf } from "@/lib/currency";
import { db } from "@/lib/db";
import { personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import { inScope } from "@/lib/ledger/balances";
import { loadGroupLedgers, type Ledger } from "@/lib/ledger/load";
import { openAmount, pairBalance, pendingBetween, settleRole, type SettleRole } from "@/lib/ledger/pair";
import { cents, sumCents, type Cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import type { SettleDirection } from "@/lib/settlements/schema";
import type { AskClarifyQuestion } from "../../result";
import type { AskIntent } from "../intent";
import { fingerprintOf, findPerson, note, unsupported, viewerGroups, type BuildEnv, type Built, type GroupFacts } from "./shared";

interface PairState {
  readonly group: GroupFacts;
  readonly role: SettleRole;
  readonly balance: Cents;
  readonly open: Cents;
  readonly awaiting: Cents;
  readonly bills: number;
}

const roleOf = { paid: "payer", received: "recipient" } as const satisfies Record<SettleDirection, SettleRole>;

function pairState(viewer: PersonId, other: PersonId, group: GroupFacts, ledger: Ledger, now: Date): PairState {
  const scope = { groupId: group.id, currency: group.currency };
  const balance = pairBalance(viewer, other, ledger.debts, ledger.settlements, scope, now);
  const pendingToMe = pendingBetween(ledger.settlements, other, viewer, scope, now);
  const pendingFromMe = pendingBetween(ledger.settlements, viewer, other, scope, now);
  const role = settleRole({ balance, pendingToMe, pendingFromMe });
  const plain = settleRole({ balance, pendingToMe: [], pendingFromMe });
  return {
    group,
    role,
    balance,
    open: openAmount(plain, balance, pendingFromMe),
    awaiting: sumCents(pendingFromMe.map((entry) => entry.amount)),
    bills: inScope(ledger.bills, group.id).length,
  };
}

const groupQuestion = (states: readonly PairState[]): AskClarifyQuestion => ({
  slot: "group",
  options: [...states]
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .map((state) => ({ ref: state.group.id as string, group: state.group.ref, bills: state.bills, currency: state.group.currency })),
});

async function thirdParty(viewer: PersonId, intent: AskIntent, groups: readonly GroupFacts[]): Promise<Built> {
  const from = findPerson(groups, intent.personId);
  const to = findPerson(groups, intent.secondId);
  if (!from || !to || from.id === to.id) return unsupported("needsPerson");
  const shared = groups.filter((group) => group.members.has(from.id) && group.members.has(to.id));
  const group = (intent.groupId ? shared.find((entry) => entry.id === intent.groupId) : undefined) ?? (shared.length === 1 ? shared[0] : undefined);
  const amount = group && intent.amount !== null ? Math.round(intent.amount * 10 ** minorUnitsOf(group.currency)) : null;
  return {
    kind: "denied",
    denied: {
      kind: "thirdParty",
      from,
      to,
      group: group?.ref ?? null,
      amount: amount !== null && Number.isSafeInteger(amount) && amount > 0 ? cents(amount) : null,
      currency: group?.currency ?? null,
    },
  };
}

export async function buildRecordPayment(viewer: PersonId, intent: AskIntent, env: BuildEnv): Promise<Built> {
  const groups = await viewerGroups(viewer);
  if (intent.personId !== null && intent.secondId !== null && intent.personId !== viewer && intent.secondId !== viewer) return thirdParty(viewer, intent, groups);
  const otherId = intent.personId === viewer ? intent.secondId : intent.personId;
  const other = findPerson(groups, otherId);
  const you = findPerson(groups, viewer);
  if (!other || !you || other.id === viewer) return unsupported("needsPerson");

  const shared = groups.filter((group) => group.members.has(other.id) && (intent.groupId === null || group.id === intent.groupId));
  if (shared.length === 0) return note({ kind: "square", other, group: null });
  const ledger = await loadGroupLedgers(shared.map((group) => group.id));
  const states = shared.map((group) => pairState(viewer, other.id, group, ledger, env.now));

  const waiting = states.find((state) => state.role === "confirm");
  const wanted = intent.direction === null ? null : roleOf[intent.direction];
  const matches = states.filter((state) => (wanted === null ? state.role === "payer" || state.role === "recipient" : state.role === wanted));
  if (matches.length === 0) {
    if (waiting && intent.direction !== "paid") return buildSettlePending(viewer, { ...intent, action: "settlePending", personId: other.id, groupId: waiting.group.id }, env);
    const opposite = wanted === null ? undefined : states.find((state) => state.role === "payer" || state.role === "recipient");
    if (opposite) {
      return note({ kind: "wrongWay", other, group: opposite.group.ref, amount: opposite.open, currency: opposite.group.currency, theyOwe: opposite.role === "recipient" });
    }
    const pending = states.find((state) => state.role === "awaiting");
    if (pending) return note({ kind: "awaiting", other, group: pending.group.ref, amount: pending.awaiting, currency: pending.group.currency });
    return note({ kind: "square", other, group: shared.length === 1 ? (shared[0]?.ref ?? null) : null });
  }
  if (matches.length > 1) return { kind: "clarify", question: groupQuestion(matches), intent: { ...intent, personId: other.id, secondId: null } };

  const [state] = matches;
  if (!state || state.open <= 0) return note({ kind: "square", other, group: state?.group.ref ?? null });
  const direction: SettleDirection = state.role === "payer" ? "paid" : "received";
  const resolved: AskIntent = { ...intent, personId: other.id, secondId: null, groupId: state.group.id, direction };
  const said = intent.amount === null ? null : Math.round(intent.amount * 10 ** minorUnitsOf(state.group.currency));
  const half = cents(Math.max(1, Math.round(state.open / 2)));
  if (said === null && intent.portion === null) {
    return {
      kind: "clarify",
      intent: resolved,
      question: {
        slot: "amount",
        other,
        group: state.group.ref,
        currency: state.group.currency,
        owed: state.open,
        direction,
        options: [
          { ref: "all", amount: state.open },
          ...(half < state.open ? [{ ref: "half" as const, amount: half }] : []),
          { ref: "open", amount: null },
        ],
      },
    };
  }
  const amount = said !== null && Number.isSafeInteger(said) && said > 0 ? cents(said) : intent.portion === "half" ? half : intent.portion === "open" ? null : state.open;
  const member = state.group.members.get(other.id);
  return {
    kind: "ready",
    card: {
      kind: "recordPayment",
      direction,
      you,
      other,
      group: state.group.ref,
      currency: state.group.currency,
      owed: state.open,
      amount,
      method: intent.method,
      needsConfirm: direction === "paid" && member?.hasAccount === true,
    },
    fingerprint: fingerprintOf({ group: state.group.id, other: other.id, direction, owed: state.open }),
    intent: resolved,
    exec: { do: "recordPayment", groupId: state.group.id, personId: other.id, direction, method: intent.method, max: state.open },
  };
}

const pendingSelect = {
  id: true,
  groupId: true,
  fromId: true,
  amountCents: true,
  currency: true,
  method: true,
  createdAt: true,
  from: { select: personSelect },
  group: { select: { id: true, name: true, tint: true, art: true } },
} as const;

export async function buildSettlePending(viewer: PersonId, intent: AskIntent, env: BuildEnv): Promise<Built> {
  const rows = await db.settlement.findMany({
    where: {
      toId: viewer,
      status: "PENDING",
      autoConfirmAt: { gt: env.now },
      group: { is: { deletedAt: null, members: { some: { personId: viewer, leftAt: null } } } },
      ...(intent.settlementId ? { id: intent.settlementId } : {}),
      ...(intent.personId && intent.personId !== viewer ? { fromId: intent.personId } : {}),
      ...(intent.groupId ? { groupId: intent.groupId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: pendingSelect,
  });
  const pending = rows.flatMap((row) => (row.group && row.groupId && isCurrencyCode(row.currency) ? [{ ...row, group: row.group, groupId: row.groupId, currency: row.currency }] : []));
  const other: PersonView | null = intent.personId && intent.personId !== viewer ? findPerson(await viewerGroups(viewer), intent.personId) : null;
  if (pending.length === 0) return note({ kind: "noPending", other });
  if (pending.length > 1) {
    return {
      kind: "clarify",
      intent,
      question: {
        slot: "payment",
        options: pending.map((row) => ({
          ref: row.id,
          from: toPersonView(row.from),
          group: toGroupRef(row.group),
          amount: cents(row.amountCents),
          currency: row.currency,
          at: row.createdAt.toISOString(),
        })),
      },
    };
  }
  const [row] = pending;
  if (!row) return note({ kind: "noPending", other });
  const [group] = await viewerGroups(viewer, row.groupId);
  const you = group?.members.get(viewer)?.view;
  if (!group || !you) return note({ kind: "noPending", other });
  const ledger = await loadGroupLedgers([row.groupId]);
  const balance = pairBalance(viewer, toPersonId(row.fromId), ledger.debts, ledger.settlements, { groupId: group.id, currency: row.currency }, env.now);
  return {
    kind: "ready",
    card: {
      kind: "settlePending",
      you,
      other: toPersonView(row.from),
      group: group.ref,
      currency: row.currency,
      amount: cents(row.amountCents),
      method: row.method,
      at: row.createdAt.toISOString(),
      after: cents(balance - row.amountCents),
    },
    fingerprint: fingerprintOf({ settlement: row.id, status: "PENDING" }),
    intent: { ...intent, action: "settlePending", settlementId: row.id },
    exec: { do: "settlePending", settlementId: row.id },
  };
}
