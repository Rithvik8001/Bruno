import type { PersonId } from "@/lib/domain/ids";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";

export type Roster = ReadonlyMap<PersonId, PersonView>;

export function rosterOf(members: readonly PersonView[]): Roster {
  return new Map(members.map((m) => [m.id, m]));
}

export function shortName(id: PersonId, roster: Roster, you: PersonId, youLabel: string): string {
  if (id === you) return youLabel;
  const person = roster.get(id);
  return person ? firstNameOf(person.displayName) : "";
}

export function namesOf(ids: readonly PersonId[], roster: Roster, you: PersonId, youLabel: string): string {
  return ids.map((id) => shortName(id, roster, you, youLabel)).join(", ");
}
