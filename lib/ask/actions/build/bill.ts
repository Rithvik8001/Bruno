import "server-only";
import { routes } from "@/lib/auth/rules";
import { claimSummary, restClaimants } from "@/lib/bills/claims";
import { toBillInput } from "@/lib/bills/input";
import { loadGroupRoster } from "@/lib/bills/persist";
import { getEditableBill } from "@/lib/bills/queries";
import type { BillValues, UpdateBillInput } from "@/lib/bills/schema";
import { computeShares } from "@/lib/bills/split";
import { billTotals } from "@/lib/bills/totals";
import type { BillInput } from "@/lib/bills/types";
import { occurredAtOf, peopleOnBill } from "@/lib/bills/write";
import { minorUnitsOf, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { billId as toBillId, personId as toPersonId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { billDebts, type Debt } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { pairBalance } from "@/lib/ledger/pair";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import type { ActionBill, BalanceMove, BillEffect, ShareRow } from "../card";
import type { AskIntent } from "../intent";
import { ACTION_DATE_BACK_DAYS, ACTION_MOVES_MAX, type AskBillAction } from "../kinds";
import { fingerprintOf, note, unsupported, type BuildEnv, type Built } from "./shared";

export interface LoadedBill {
  readonly billId: string;
  readonly groupId: GroupId;
  readonly currency: CurrencyCode;
  readonly canEdit: boolean;
  readonly claiming: boolean;
  readonly values: BillValues;
  readonly bill: ActionBill;
  readonly creator: PersonView;
  readonly active: readonly PersonView[];
  readonly people: ReadonlyMap<string, PersonView>;
}

const unique = (ids: readonly string[]) => [...new Set(ids)];

function totalOf(input: BillInput): Cents {
  const totals = billTotals(
    input.items.map((item) => item.priceCents),
    input,
  );
  return totals.ok ? totals.value.total : ZERO_CENTS;
}

export async function loadActionBill(viewer: PersonId, id: string): Promise<LoadedBill | null> {
  const row = await db.bill.findFirst({
    where: {
      id,
      deletedAt: null,
      status: { in: ["FINALIZED", "CLAIMING"] },
      group: { is: { deletedAt: null, members: { some: { personId: viewer, leftAt: null } } } },
    },
    select: { slug: true, createdBy: { select: personSelect } },
  });
  if (!row) return null;
  const editable = await getEditableBill(row.slug, viewer);
  if (!editable) return null;
  const roster = await loadGroupRoster(editable.composer.id);
  if (!roster) return null;

  const source = editable.values;
  const values: BillValues = {
    title: source.title,
    occurredOn: source.occurredOn,
    payerId: source.payerId,
    items: source.items,
    taxCents: source.taxCents,
    tip: source.tip,
    discountCents: source.discountCents,
    method: source.method,
    participants: source.participants,
  };
  const people = new Map<string, PersonView>(editable.composer.members.map((member) => [member.id, member]));
  const activeIds = new Set<string>(roster.roster.map((member) => member.personId));
  const active = editable.composer.members.filter((member) => activeIds.has(member.id));
  const payer = people.get(values.payerId);
  if (!payer) return null;
  const claimers = unique(values.items.flatMap((item) => item.claimedBy));
  return {
    billId: editable.billId,
    groupId: editable.composer.id,
    currency: editable.composer.currency,
    canEdit: editable.canEdit,
    claiming: editable.claiming,
    values,
    creator: toPersonView(row.createdBy),
    active,
    people,
    bill: {
      id: editable.billId,
      href: routes.bill(editable.slug),
      editHref: routes.editBill(editable.slug),
      title: values.title,
      group: { id: editable.composer.id, name: editable.composer.name, tint: editable.composer.tint, art: editable.composer.art },
      payer,
      total: totalOf(toBillInput(values)),
      currency: editable.composer.currency,
      day: values.occurredOn,
      method: values.method,
      people: unique(peopleOnBill(values)).length,
      claiming: editable.claiming ? { claimed: claimers.length, people: active.length } : null,
    },
  };
}

export async function billOptions(viewer: PersonId, ids: readonly string[]): Promise<{ ref: string; bill: ActionBill }[]> {
  const loaded = await Promise.all(ids.map((id) => loadActionBill(viewer, id)));
  return loaded.flatMap((entry) => (entry ? [{ ref: entry.billId, bill: entry.bill }] : []));
}

function sharesOf(values: BillValues): Map<string, Cents> | null {
  const split = computeShares(toBillInput(values));
  return split.ok ? new Map([...split.value.shares].map(([id, share]) => [id as string, share.total])) : null;
}

function claimShares(values: BillValues): Map<string, Cents> {
  const input = toBillInput({ ...values, method: "ITEMS" });
  const summary = claimSummary(input.items, input);
  return new Map(unique(values.items.flatMap((item) => item.claimedBy)).map((id) => [id, summary.shareOf(toPersonId(id)).total]));
}

function shareRows(loaded: LoadedBill, before: ReadonlyMap<string, Cents>, after: ReadonlyMap<string, Cents>, viewer: PersonId): ShareRow[] {
  const ids = unique([...after.keys(), ...before.keys()]);
  return ids
    .flatMap((id): ShareRow[] => {
      const person = loaded.people.get(id);
      return person ? [{ person, before: before.get(id) ?? null, after: after.get(id) ?? ZERO_CENTS }] : [];
    })
    .sort((a, b) => Number(b.person.id === viewer) - Number(a.person.id === viewer));
}

const updateInput = (loaded: LoadedBill, next: BillValues): UpdateBillInput => ({ ...next, billId: loaded.billId });

function ready(loaded: LoadedBill, intent: AskIntent, card: Extract<Built, { kind: "ready" }>["card"], next: BillValues | null, exec?: Extract<Built, { kind: "ready" }>["exec"]): Built {
  return {
    kind: "ready",
    card,
    fingerprint: fingerprintOf({ values: loaded.values, claiming: loaded.claiming, next }),
    intent: { ...intent, billId: loaded.billId },
    exec: exec ?? { do: "updateBill", input: updateInput(loaded, next ?? loaded.values) },
  };
}

function debtsOf(loaded: LoadedBill, values: BillValues): Debt[] {
  const split = computeShares(toBillInput(values));
  if (!split.ok) return [];
  return billDebts(
    { id: toBillId(loaded.billId), payerId: toPersonId(values.payerId), groupId: loaded.groupId, currency: loaded.currency, occurredAt: occurredAtOf(values.occurredOn) },
    split.value,
  );
}

function netWith(viewer: PersonId, debts: readonly Debt[]): Map<string, number> {
  const net = new Map<string, number>();
  for (const debt of debts) {
    if (debt.to === viewer && debt.from !== viewer) net.set(debt.from, (net.get(debt.from) ?? 0) + debt.amount);
    if (debt.from === viewer && debt.to !== viewer) net.set(debt.to, (net.get(debt.to) ?? 0) - debt.amount);
  }
  return net;
}

function deltas(viewer: PersonId, before: readonly Debt[], after: readonly Debt[]): Map<string, number> {
  const a = netWith(viewer, before);
  const b = netWith(viewer, after);
  return new Map(unique([...a.keys(), ...b.keys()]).flatMap((id): [string, number][] => {
    const delta = (b.get(id) ?? 0) - (a.get(id) ?? 0);
    return delta === 0 ? [] : [[id, delta]];
  }));
}

async function balanceMoves(viewer: PersonId, loaded: LoadedBill, next: BillValues, env: BuildEnv): Promise<BalanceMove[]> {
  if (loaded.claiming) return [];
  const changed = deltas(viewer, debtsOf(loaded, loaded.values), debtsOf(loaded, next));
  if (changed.size === 0) return [];
  const ledger = await loadGroupLedgers([loaded.groupId]);
  return [...changed]
    .flatMap(([id, delta]): BalanceMove[] => {
      const person = loaded.people.get(id);
      if (!person) return [];
      const before = pairBalance(viewer, toPersonId(id), ledger.debts, ledger.settlements, { groupId: loaded.groupId, currency: loaded.currency }, env.now);
      return [{ person, before, after: cents(before + delta) }];
    })
    .slice(0, ACTION_MOVES_MAX);
}

function evenValues(loaded: LoadedBill): BillValues {
  const ids = loaded.claiming ? loaded.active.map((member) => member.id as string) : unique(peopleOnBill(loaded.values));
  return { ...loaded.values, method: "EVEN", participants: ids.map((personId) => ({ personId, shares: 1, percentBps: null, amountCents: null })) };
}

function finishedValues(loaded: LoadedBill): BillValues {
  const input = toBillInput({ ...loaded.values, method: "ITEMS" });
  const everyone = restClaimants(input.items, toPersonId(loaded.values.payerId)).map((id) => id as string);
  return {
    ...loaded.values,
    method: "ITEMS",
    items: loaded.values.items.map((item) => (item.claimedBy.length === 0 && item.priceCents > 0 ? { ...item, claimedBy: everyone } : item)),
  };
}

function simpleBill(values: BillValues): boolean {
  const [item] = values.items;
  return (
    values.items.length === 1 &&
    item !== undefined &&
    item.quantity === 1 &&
    values.taxCents === 0 &&
    values.discountCents === 0 &&
    values.tip.kind === "NONE" &&
    values.method !== "AMOUNT"
  );
}

function dayInRange(day: string, today: string): boolean {
  const earliest = new Date(Date.parse(`${today}T12:00:00.000Z`) - ACTION_DATE_BACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return day <= today && day >= earliest;
}

export async function buildBillChange(viewer: PersonId, intent: AskIntent, action: Exclude<AskBillAction, "remindClaims">, billId: string, env: BuildEnv): Promise<Built> {
  const loaded = await loadActionBill(viewer, billId);
  if (!loaded) return unsupported("billGone");
  if (!loaded.canEdit) return { kind: "denied", denied: { kind: "billDenied", action, bill: loaded.bill, owner: loaded.creator } };
  const { values, bill } = loaded;

  switch (action) {
    case "splitEvenly": {
      const next = evenValues(loaded);
      const after = sharesOf(next);
      if (!after || next.participants.length === 0) return unsupported("simpleBill", { bill });
      const same = !loaded.claiming && values.method === "EVEN" && unique(peopleOnBill(values)).sort().join() === next.participants.map((p) => p.personId).sort().join();
      if (same) return note({ kind: "noChange", bill });
      const before = sharesOf(values) ?? claimShares(values);
      const each = Math.min(...after.values());
      return ready(loaded, intent, { kind: "splitEvenly", bill, rows: shareRows(loaded, before, after, viewer), each: cents(each), closes: loaded.claiming }, next);
    }
    case "changePayer": {
      const to = intent.personId === null ? undefined : loaded.people.get(intent.personId);
      const allowed = to && (loaded.active.some((member) => member.id === to.id) || peopleOnBill(values).includes(to.id));
      if (!to || !allowed) return unsupported("needsPerson", { bill });
      if (to.id === values.payerId) return note({ kind: "noChange", bill });
      const next = { ...values, payerId: to.id };
      return ready(loaded, intent, { kind: "changePayer", bill, to, moves: await balanceMoves(viewer, loaded, next, env) }, next);
    }
    case "renameBill": {
      const title = intent.title?.trim() ?? "";
      if (title === "") return unsupported("generic", { bill });
      if (title === values.title) return note({ kind: "noChange", bill });
      return ready(loaded, intent, { kind: "renameBill", bill, title }, { ...values, title });
    }
    case "changeDate": {
      if (intent.date === null || !dayInRange(intent.date, env.today)) return unsupported("badDate", { bill });
      if (intent.date === values.occurredOn) return note({ kind: "noChange", bill });
      return ready(loaded, intent, { kind: "changeDate", bill, day: intent.date }, { ...values, occurredOn: intent.date });
    }
    case "changeTotal": {
      const [item] = values.items;
      if (loaded.claiming || !item || !simpleBill(values) || intent.amount === null) return unsupported("simpleBill", { bill });
      const total = Math.round(intent.amount * 10 ** minorUnitsOf(loaded.currency));
      if (!Number.isSafeInteger(total) || total <= 0) return unsupported("simpleBill", { bill });
      if (total === bill.total) return note({ kind: "noChange", bill });
      const next = { ...values, items: [{ ...item, priceCents: total }] };
      const before = sharesOf(values);
      const after = sharesOf(next);
      if (!before || !after) return unsupported("simpleBill", { bill });
      return ready(loaded, intent, { kind: "changeTotal", bill, total: cents(total), rows: shareRows(loaded, before, after, viewer) }, next);
    }
    case "finishClaiming": {
      if (!loaded.claiming) return unsupported("notClaiming", { bill });
      const next = finishedValues(loaded);
      const after = sharesOf(next);
      if (!after) return unsupported("simpleBill", { bill });
      const open = values.items.filter((item) => item.claimedBy.length === 0 && item.priceCents > 0);
      return ready(
        loaded,
        intent,
        {
          kind: "finishClaiming",
          bill,
          items: open.map((item) => ({ name: item.name, price: cents(item.priceCents) })),
          unclaimed: cents(open.reduce((sum, item) => sum + item.priceCents, 0)),
          rows: shareRows(loaded, claimShares(values), after, viewer),
        },
        null,
        { do: "finishClaiming", billId: loaded.billId },
      );
    }
    case "deleteBill": {
      const changed = loaded.claiming ? new Map<string, number>() : deltas(viewer, debtsOf(loaded, values), []);
      const effects = [...changed].flatMap(([id, delta]): BillEffect[] => {
        const person = loaded.people.get(id);
        return person ? [{ person, delta: cents(-delta) }] : [];
      });
      return ready(loaded, intent, { kind: "deleteBill", bill, effects }, null, { do: "deleteBill", billId: loaded.billId });
    }
  }
}
