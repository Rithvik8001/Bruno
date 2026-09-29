import "server-only";
import { isCurrencyCode, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { personId, settlementId, type PersonId, type SettlementId } from "@/lib/domain/ids";
import type { PaymentMethod, SettlementStatus } from "@/lib/ledger/rules";
import { canConfirm, canDecline, canUndo, countsTowardBalance, type SettlementState } from "@/lib/ledger/settlements";
import { cents, type Cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonRow, type PersonView } from "@/lib/people/person";

export const settlementSelect = {
  id: true,
  groupId: true,
  currency: true,
  amountCents: true,
  method: true,
  note: true,
  status: true,
  autoConfirmAt: true,
  confirmedAt: true,
  undoUntil: true,
  createdAt: true,
  fromId: true,
  toId: true,
  recordedById: true,
  from: { select: personSelect },
  to: { select: personSelect },
} as const;

export interface SettlementRow {
  readonly id: string;
  readonly groupId: string | null;
  readonly currency: string;
  readonly amountCents: number;
  readonly method: PaymentMethod;
  readonly note: string | null;
  readonly status: SettlementStatus;
  readonly autoConfirmAt: Date | null;
  readonly confirmedAt: Date | null;
  readonly undoUntil: Date | null;
  readonly createdAt: Date;
  readonly fromId: string;
  readonly toId: string;
  readonly recordedById: string;
  readonly from: PersonRow;
  readonly to: PersonRow;
}

export interface SettlementActions {
  readonly confirm: boolean;
  readonly decline: boolean;
  readonly undo: boolean;
}

export interface SettlementCard {
  readonly id: SettlementId;
  readonly from: PersonView;
  readonly to: PersonView;
  readonly recordedBy: PersonId;
  readonly currency: CurrencyCode;
  readonly amount: Cents;
  readonly method: PaymentMethod;
  readonly note: string | null;
  readonly status: SettlementStatus;
  readonly counts: boolean;
  readonly createdAt: Date;
  readonly autoConfirmAt: Date | null;
  readonly undoUntil: Date | null;
  readonly actions: SettlementActions;
}

export function stateOf(row: Pick<SettlementRow, "fromId" | "toId" | "recordedById" | "status" | "autoConfirmAt" | "undoUntil">): SettlementState {
  return {
    from: personId(row.fromId),
    to: personId(row.toId),
    recordedBy: personId(row.recordedById),
    status: row.status,
    autoConfirmAt: row.autoConfirmAt,
    undoUntil: row.undoUntil,
  };
}

export function toSettlementCard(row: SettlementRow, you: PersonId, now: Date): SettlementCard {
  const state = stateOf(row);
  return {
    id: settlementId(row.id),
    from: toPersonView(row.from),
    to: toPersonView(row.to),
    recordedBy: state.recordedBy,
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
    amount: cents(row.amountCents),
    method: row.method,
    note: row.note,
    status: row.status,
    counts: countsTowardBalance(state, now),
    createdAt: row.createdAt,
    autoConfirmAt: row.autoConfirmAt,
    undoUntil: row.undoUntil,
    actions: {
      confirm: canConfirm(state, you, now),
      decline: canDecline(state, you, now),
      undo: canUndo(state, you, now),
    },
  };
}
