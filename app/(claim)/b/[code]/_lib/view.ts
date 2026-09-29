import { claimSummary, type ClaimSummary } from "@/lib/bills/claims";
import type { BillCharges } from "@/lib/bills/types";
import type { LiveItem } from "@/lib/claiming/queries";
import { personId, type PersonId } from "@/lib/domain/ids";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";

export type ClaimMap = Readonly<Record<string, readonly PersonId[]>>;

export interface ClaimToggle {
  readonly itemId: string;
  readonly person: PersonId;
  readonly on: boolean;
}

export function claimMapOf(items: readonly LiveItem[]): ClaimMap {
  return Object.fromEntries(items.map((item) => [item.id, item.claimants.map((c) => c.id)]));
}

export function applyToggle(map: ClaimMap, { itemId, person, on }: ClaimToggle): ClaimMap {
  const current = map[itemId] ?? [];
  const next = on ? (current.includes(person) ? current : [...current, person]) : current.filter((id) => id !== person);
  return { ...map, [itemId]: next };
}

export function summaryOf(items: readonly LiveItem[], claims: ClaimMap, charges: BillCharges): ClaimSummary {
  return claimSummary(
    items.map((item) => ({ id: item.id, priceCents: item.price, claimedBy: claims[item.id] ?? [] })),
    charges,
  );
}

export type People = ReadonlyMap<PersonId, PersonView>;

export function peopleOf(items: readonly LiveItem[], extra: readonly (PersonView | null)[]): People {
  const people = new Map<PersonId, PersonView>();
  for (const item of items) for (const person of item.claimants) people.set(person.id, person);
  for (const person of extra) if (person) people.set(personId(person.id), person);
  return people;
}

export function nameFor(id: PersonId, people: People, you: PersonId | null, youLabel: string): string {
  if (id === you) return youLabel;
  const person = people.get(id);
  return person ? firstNameOf(person.displayName) : "";
}
