import "server-only";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { db } from "@/lib/db";
import { groupId, personId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { parseTint } from "@/lib/people/defaults";

export interface CommandGroup {
  readonly id: GroupId;
  readonly name: string;
  readonly tint: PaletteTint;
}

export interface CommandPerson {
  readonly id: PersonId;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly groupId: GroupId;
}

export interface CommandIndex {
  readonly groups: readonly CommandGroup[];
  readonly people: readonly CommandPerson[];
}

export async function getCommandIndex(you: PersonId): Promise<CommandIndex> {
  const rows = await db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: you, leftAt: null } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tint: true,
      members: {
        where: { leftAt: null, personId: { not: you }, person: { deletedAt: null } },
        orderBy: { joinedAt: "asc" },
        select: { person: { select: { id: true, displayName: true, tint: true } } },
      },
    },
  });

  const people = new Map<string, CommandPerson>();
  for (const row of rows) {
    for (const { person } of row.members) {
      if (people.has(person.id)) continue;
      people.set(person.id, {
        id: personId(person.id),
        name: person.displayName,
        tint: parseTint(person.tint, person.displayName),
        groupId: groupId(row.id),
      });
    }
  }

  return {
    groups: rows.map((row) => ({ id: groupId(row.id), name: row.name, tint: parseTint(row.tint, row.name) })),
    people: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
