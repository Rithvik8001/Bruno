import "server-only";
import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { personId, type PersonId } from "@/lib/domain/ids";
import { defaultPersonTint, parseBuddy, parseTint } from "./defaults";

export interface PersonView {
  readonly id: PersonId;
  readonly displayName: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
  readonly onboarded: boolean;
}

export interface PersonOwner {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export const personSelect = { id: true, displayName: true, tint: true, buddy: true, onboardedAt: true } as const;

export type PersonRow = { id: string; displayName: string; tint: string; buddy: string | null; onboardedAt: Date | null };

export function toPersonView(row: PersonRow): PersonView {
  return {
    id: personId(row.id),
    displayName: row.displayName,
    tint: parseTint(row.tint, row.displayName),
    buddy: parseBuddy(row.buddy),
    onboarded: row.onboardedAt !== null,
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

export async function getDefaultCurrency(id: PersonId): Promise<CurrencyCode> {
  const row = await db.person.findUnique({ where: { id }, select: { defaultCurrency: true } });
  return row && isCurrencyCode(row.defaultCurrency) ? row.defaultCurrency : DEFAULT_CURRENCY;
}
