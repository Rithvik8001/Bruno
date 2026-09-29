import type { BillTipValue, BillValues } from "@/lib/bills/schema";
import { FULL_PERCENT_BPS } from "@/lib/bills/types";
import { personId, type PersonId } from "@/lib/domain/ids";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { SHARES_RANGE, type SplitTab } from "../data";

export interface DraftItem {
  readonly key: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents | null;
}

export type DraftTip =
  | { readonly mode: "none" }
  | { readonly mode: "percent"; readonly percent: number }
  | { readonly mode: "amount"; readonly amount: Cents | null };

export interface SplitPerson {
  readonly included: boolean;
  readonly shares: number;
  readonly percent: number | null;
  readonly amount: Cents | null;
}

export interface BillDraft {
  readonly title: string;
  readonly occurredOn: string;
  readonly payerId: PersonId;
  readonly items: readonly DraftItem[];
  readonly nextKey: number;
  readonly tax: Cents | null;
  readonly tip: DraftTip;
  readonly discount: Cents | null;
  readonly claims: Readonly<Record<string, readonly PersonId[]>>;
  readonly method: SplitTab;
  readonly people: Readonly<Record<PersonId, SplitPerson>>;
}

const BPS_PER_PERCENT = FULL_PERCENT_BPS / 100;

const pad = (n: number) => String(n).padStart(2, "0");

export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const blankItem = (n: number): DraftItem => ({ key: `item-${n}`, name: "", quantity: 1, price: null });

const freshPerson: SplitPerson = { included: true, shares: SHARES_RANGE.min, percent: null, amount: null };

export function emptyDraft(members: readonly PersonId[], you: PersonId, today: string): BillDraft {
  return {
    title: "",
    occurredOn: today,
    payerId: you,
    items: [blankItem(0)],
    nextKey: 1,
    tax: null,
    tip: { mode: "none" },
    discount: null,
    claims: {},
    method: "EVEN",
    people: Object.fromEntries(members.map((id) => [id, freshPerson])) as Record<PersonId, SplitPerson>,
  };
}

export function addItem(draft: BillDraft): BillDraft {
  return { ...draft, items: [...draft.items, blankItem(draft.nextKey)], nextKey: draft.nextKey + 1 };
}

export function updateItem(draft: BillDraft, key: string, patch: Partial<Omit<DraftItem, "key">>): BillDraft {
  return { ...draft, items: draft.items.map((item) => (item.key === key ? { ...item, ...patch } : item)) };
}

export function removeItem(draft: BillDraft, key: string): BillDraft {
  const items = draft.items.filter((item) => item.key !== key);
  const claims = Object.fromEntries(Object.entries(draft.claims).filter(([k]) => k !== key));
  if (items.length > 0) return { ...draft, items, claims };
  return { ...draft, items: [blankItem(draft.nextKey)], nextKey: draft.nextKey + 1, claims };
}

export function claimantsOf(draft: BillDraft, key: string): readonly PersonId[] {
  return draft.claims[key] ?? [];
}

export function toggleClaim(draft: BillDraft, key: string, person: PersonId): BillDraft {
  const current = claimantsOf(draft, key);
  const next = current.includes(person) ? current.filter((id) => id !== person) : [...current, person];
  return { ...draft, claims: { ...draft.claims, [key]: next } };
}

export function claimRest(draft: BillDraft, keys: readonly string[], members: readonly PersonId[]): BillDraft {
  const claims = { ...draft.claims };
  for (const key of keys) claims[key] = [...members];
  return { ...draft, claims };
}

export function personIn(draft: BillDraft, id: PersonId): SplitPerson {
  return draft.people[id] ?? freshPerson;
}

export function updatePerson(draft: BillDraft, id: PersonId, patch: Partial<SplitPerson>): BillDraft {
  return { ...draft, people: { ...draft.people, [id]: { ...personIn(draft, id), ...patch } } };
}

export function includedIds(draft: BillDraft, members: readonly PersonId[]): PersonId[] {
  return members.filter((id) => personIn(draft, id).included);
}

export function fillRemainder(draft: BillDraft, members: readonly PersonId[], you: PersonId, total: Cents): BillDraft {
  const others = includedIds(draft, members).filter((id) => id !== you);
  if (draft.method === "AMOUNT") {
    const assigned = sumCents(others.map((id) => personIn(draft, id).amount ?? ZERO_CENTS));
    return updatePerson(draft, you, { included: true, amount: cents(Math.max(0, total - assigned)) });
  }
  const assigned = others.reduce((sum, id) => sum + (personIn(draft, id).percent ?? 0), 0);
  return updatePerson(draft, you, { included: true, percent: Math.max(0, 100 - assigned) });
}

function tipDraft(tip: BillTipValue, subtotal: number): DraftTip {
  switch (tip.kind) {
    case "NONE":
      return { mode: "none" };
    case "AMOUNT":
      return { mode: "amount", amount: cents(tip.cents) };
    case "PERCENT":
      return tip.bps % BPS_PER_PERCENT === 0
        ? { mode: "percent", percent: tip.bps / BPS_PER_PERCENT }
        : { mode: "amount", amount: cents(Math.round((subtotal * tip.bps) / (BPS_PER_PERCENT * 100))) };
  }
}

export function draftFromBill(values: BillValues, members: readonly PersonId[]): BillDraft {
  const items = values.items.map((item, index) => ({
    key: `item-${index}`,
    name: item.name,
    quantity: item.quantity,
    price: cents(item.priceCents),
  }));
  const byItems = values.method === "ITEMS";
  const participants = new Map(values.participants.map((p) => [p.personId, p]));
  const people = Object.fromEntries(
    members.map((id) => {
      const p = participants.get(id);
      const person: SplitPerson = p
        ? {
            included: true,
            shares: p.shares,
            percent: p.percentBps === null ? null : Math.round(p.percentBps / BPS_PER_PERCENT),
            amount: p.amountCents === null ? null : cents(p.amountCents),
          }
        : { ...freshPerson, included: byItems };
      return [id, person];
    }),
  ) as Record<PersonId, SplitPerson>;

  return {
    title: values.title,
    occurredOn: values.occurredOn,
    payerId: personId(values.payerId),
    items,
    nextKey: items.length,
    tax: values.taxCents > 0 ? cents(values.taxCents) : null,
    tip: tipDraft(values.tip, values.items.reduce((sum, item) => sum + item.priceCents, 0)),
    discount: values.discountCents > 0 ? cents(values.discountCents) : null,
    claims: byItems
      ? Object.fromEntries(items.map((item, index) => [item.key, (values.items[index]?.claimedBy ?? []).map(personId)]))
      : {},
    method: values.method === "ITEMS" ? "EVEN" : values.method,
    people,
  };
}
