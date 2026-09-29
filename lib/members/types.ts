import type { BuddyShape } from "@/lib/design-system/buddies";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const MAX_GROUP_MEMBERS = 50;

export interface FoundPerson {
  readonly displayName: string;
  readonly username: string;
  readonly tint: PaletteTint;
  readonly buddy: BuddyShape | null;
}

export type LookupResult =
  | { readonly status: "none" }
  | { readonly status: "member"; readonly person: FoundPerson }
  | { readonly status: "found" | "former"; readonly person: FoundPerson; readonly ticket: string };
