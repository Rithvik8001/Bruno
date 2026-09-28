import "server-only";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { db } from "@/lib/db";
import { personId, type PersonId } from "@/lib/domain/ids";
import { defaultPersonTint, parseBuddy, parseTint } from "./defaults";

export interface PersonView {
  readonly id: PersonId;
  readonly displayName: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
}

export interface PersonOwner {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

const personSelect = { id: true, displayName: true, tint: true, buddy: true } as const;

type PersonRow = { id: string; displayName: string; tint: string; buddy: string | null };

export function toPersonView(row: PersonRow): PersonView {
  return {
    id: personId(row.id),
    displayName: row.displayName,
    tint: parseTint(row.tint, row.displayName),
    buddy: parseBuddy(row.buddy),
  };
}

export async function ensurePersonForUser(user: PersonOwner): Promise<PersonView> {
  const row = await db.person.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: user.name,
      email: user.email,
      tint: defaultPersonTint(user.name || user.email),
    },
    select: personSelect,
  });
  return toPersonView(row);
}

export async function findPersonForUser(userId: string): Promise<PersonView | null> {
  const row = await db.person.findUnique({ where: { userId }, select: personSelect });
  return row ? toPersonView(row) : null;
}
