import { DELETED_MEMBER_NAME } from "@/lib/account/rules";
import { buddyHash, isBuddyShape, type BuddyShape } from "@/lib/design-system/buddies";
import { PALETTE_TINTS, type PaletteTint } from "@/lib/design-system/tokens";

export function isPaletteTint(value: string): value is PaletteTint {
  return (PALETTE_TINTS as readonly string[]).includes(value);
}

export function defaultPersonTint(seed: string): PaletteTint {
  return PALETTE_TINTS[buddyHash(seed) % PALETTE_TINTS.length] ?? "violet";
}

export function parseTint(value: string, seed: string): PaletteTint {
  return isPaletteTint(value) ? value : defaultPersonTint(seed);
}

export function parseBuddy(value: string | null): BuddyShape | null {
  return value !== null && isBuddyShape(value) ? value : null;
}

export function firstNameOf(name: string): string {
  if (name === DELETED_MEMBER_NAME) return name;
  return name.trim().split(/\s+/)[0] ?? "";
}
