import type { CurrencyCode } from "@/lib/currency";
import type { GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import type { Cents } from "@/lib/money";

export const CONFIRM_WORD = "DELETE";
export const DELETED_MEMBER_NAME = "Deleted member";

export function matchesConfirm(text: string): boolean {
  return text.trim().toUpperCase() === CONFIRM_WORD;
}

export interface MoneyAmount {
  readonly currency: CurrencyCode;
  readonly amount: Cents;
}

export interface BlockGroup {
  readonly id: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly balance: MoneyAmount;
}

export interface SettleTarget {
  readonly groupId: string;
  readonly personId: string;
}

export type DeleteBlock =
  | {
      readonly kind: "money";
      readonly owed: readonly MoneyAmount[];
      readonly owe: readonly MoneyAmount[];
      readonly groups: readonly BlockGroup[];
      readonly settle: SettleTarget | null;
    }
  | { readonly kind: "payment"; readonly direction: "sent" | "received"; readonly name: string; readonly amount: MoneyAmount }
  | { readonly kind: "claiming"; readonly title: string; readonly code: string }
  | { readonly kind: "admin"; readonly groupId: string; readonly name: string };

export type DeleteStatus =
  | { readonly kind: "allowed"; readonly groups: number }
  | { readonly kind: "blocked"; readonly block: DeleteBlock };

export type DeleteOutcome = { readonly kind: "deleted" } | { readonly kind: "blocked"; readonly block: DeleteBlock };

export interface DeleteFacts {
  readonly groups: number;
  readonly payment: Extract<DeleteBlock, { kind: "payment" }> | null;
  readonly money: Extract<DeleteBlock, { kind: "money" }> | null;
  readonly claiming: Extract<DeleteBlock, { kind: "claiming" }> | null;
  readonly admin: Extract<DeleteBlock, { kind: "admin" }> | null;
}

export function decideDelete(facts: DeleteFacts): DeleteStatus {
  const block = facts.payment ?? facts.money ?? facts.claiming ?? facts.admin;
  return block ? { kind: "blocked", block } : { kind: "allowed", groups: facts.groups };
}
