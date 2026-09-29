import type { PersonId } from "@/lib/domain/ids";
import { cents, sumCents, ZERO_CENTS, type Cents } from "@/lib/money";
import { SHARES_RANGE, type SplitTab } from "../_data";

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
