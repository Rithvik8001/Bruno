import type { PersonId } from "@/lib/domain/ids";
import { err, ok, type Result } from "@/lib/domain/result";
import { cents, type Cents } from "@/lib/money";
import { settlementRules, type SettlementStatus } from "./rules";

export interface SettlementState {
  readonly from: PersonId;
  readonly to: PersonId;
  readonly recordedBy: PersonId;
  readonly status: SettlementStatus;
  readonly autoConfirmAt: Date | null;
  readonly undoUntil: Date | null;
}

export type InitialSettlement = Pick<SettlementState, "status" | "autoConfirmAt" | "undoUntil"> & {
  readonly confirmedAt: Date | null;
};

export type SettlementRecorderError = { readonly kind: "notAParty" } | { readonly kind: "samePerson" };

const later = (now: Date, ms: number): Date => new Date(now.getTime() + ms);

export function initialSettlement(
  recordedBy: PersonId,
  from: PersonId,
  to: PersonId,
  now: Date,
): Result<InitialSettlement, SettlementRecorderError> {
  if (from === to) return err({ kind: "samePerson" });
  if (recordedBy === to) {
    return ok({
      status: "CONFIRMED",
      confirmedAt: now,
      autoConfirmAt: null,
      undoUntil: later(now, settlementRules.undoWindowMs),
    });
  }
  if (recordedBy === from) {
    return ok({
      status: "PENDING",
      confirmedAt: null,
      autoConfirmAt: later(now, settlementRules.autoConfirmAfterMs),
      undoUntil: null,
    });
  }
  return err({ kind: "notAParty" });
}

export function countsTowardBalance(
  settlement: Pick<SettlementState, "status" | "autoConfirmAt">,
  now: Date,
): boolean {
  switch (settlement.status) {
    case "CONFIRMED":
      return true;
    case "PENDING":
      return settlement.autoConfirmAt !== null && now.getTime() >= settlement.autoConfirmAt.getTime();
    case "CANCELLED":
      return false;
  }
}

export function canConfirm(settlement: SettlementState, actor: PersonId, now: Date): boolean {
  return settlement.status === "PENDING" && actor === settlement.to && !countsTowardBalance(settlement, now);
}

export function canUndo(settlement: SettlementState, actor: PersonId, now: Date): boolean {
  if (actor !== settlement.recordedBy) return false;
  switch (settlement.status) {
    case "CONFIRMED":
      return settlement.undoUntil !== null && now.getTime() < settlement.undoUntil.getTime();
    case "PENDING":
      return !countsTowardBalance(settlement, now);
    case "CANCELLED":
      return false;
  }
}

export function remainingAfter(owed: Cents, paid: Cents): Cents {
  return cents(Math.max(0, owed - paid));
}
