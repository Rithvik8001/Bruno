import type { Allowance } from "@/lib/ai/rules";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { SplitMethod } from "@/lib/bills/types";
import type { CurrencyCode } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/ledger/rules";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { SettleDirection } from "@/lib/settlements/schema";
import type { AskActionKind, AskBillAction, AskDecision } from "./kinds";

export interface ActionBill {
  readonly id: string;
  readonly href: string;
  readonly editHref: string;
  readonly title: string;
  readonly group: BillGroupRef;
  readonly payer: PersonView;
  readonly total: Cents;
  readonly currency: CurrencyCode;
  readonly day: string;
  readonly method: SplitMethod;
  readonly people: number;
  readonly claiming: { readonly claimed: number; readonly people: number } | null;
}

export interface ShareRow {
  readonly person: PersonView;
  readonly before: Cents | null;
  readonly after: Cents;
}

export type RemindBlock = { readonly reason: "recent"; readonly until: string } | { readonly reason: "off" } | { readonly reason: "noEmail" };

export interface DebtRow {
  readonly key: string;
  readonly person: PersonView;
  readonly group: BillGroupRef;
  readonly amount: Cents;
  readonly currency: CurrencyCode;
  readonly blocked: RemindBlock | null;
}

export interface ClaimerRow {
  readonly person: PersonView;
  readonly blocked: "off" | "noEmail" | null;
}

export interface RemindDebtsCard {
  readonly kind: "remindDebts";
  readonly only: PersonView | null;
  readonly rows: readonly DebtRow[];
}

export interface RemindClaimsCard {
  readonly kind: "remindClaims";
  readonly bill: ActionBill;
  readonly rows: readonly ClaimerRow[];
  readonly unclaimed: Cents;
}

export interface RecordPaymentCard {
  readonly kind: "recordPayment";
  readonly direction: SettleDirection;
  readonly you: PersonView;
  readonly other: PersonView;
  readonly group: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly owed: Cents;
  readonly amount: Cents | null;
  readonly method: PaymentMethod;
  readonly needsConfirm: boolean;
}

export interface SettlePendingCard {
  readonly kind: "settlePending";
  readonly you: PersonView;
  readonly other: PersonView;
  readonly group: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly amount: Cents;
  readonly method: PaymentMethod;
  readonly at: string;
  readonly after: Cents;
}

export interface SplitEvenlyCard {
  readonly kind: "splitEvenly";
  readonly bill: ActionBill;
  readonly rows: readonly ShareRow[];
  readonly each: Cents;
  readonly closes: boolean;
}

export interface BalanceMove {
  readonly person: PersonView;
  readonly before: Cents;
  readonly after: Cents;
}

export interface ChangePayerCard {
  readonly kind: "changePayer";
  readonly bill: ActionBill;
  readonly to: PersonView;
  readonly moves: readonly BalanceMove[];
}

export interface RenameBillCard {
  readonly kind: "renameBill";
  readonly bill: ActionBill;
  readonly title: string;
}

export interface ChangeDateCard {
  readonly kind: "changeDate";
  readonly bill: ActionBill;
  readonly day: string;
}

export interface ChangeTotalCard {
  readonly kind: "changeTotal";
  readonly bill: ActionBill;
  readonly total: Cents;
  readonly rows: readonly ShareRow[];
}

export interface FinishClaimingCard {
  readonly kind: "finishClaiming";
  readonly bill: ActionBill;
  readonly items: readonly { readonly name: string; readonly price: Cents }[];
  readonly unclaimed: Cents;
  readonly rows: readonly ShareRow[];
}

export interface BillEffect {
  readonly person: PersonView;
  readonly delta: Cents;
}

export interface DeleteBillCard {
  readonly kind: "deleteBill";
  readonly bill: ActionBill;
  readonly effects: readonly BillEffect[];
}

export type AskActionCard =
  | RemindDebtsCard
  | RemindClaimsCard
  | RecordPaymentCard
  | SettlePendingCard
  | SplitEvenlyCard
  | ChangePayerCard
  | RenameBillCard
  | ChangeDateCard
  | ChangeTotalCard
  | FinishClaimingCard
  | DeleteBillCard;

export type AskDenied =
  | { readonly kind: "billDenied"; readonly action: AskBillAction; readonly bill: ActionBill; readonly owner: PersonView }
  | {
      readonly kind: "thirdParty";
      readonly from: PersonView;
      readonly to: PersonView;
      readonly group: BillGroupRef | null;
      readonly amount: Cents | null;
      readonly currency: CurrencyCode | null;
    };

export const ASK_UNSUPPORTED = ["generic", "simpleBill", "notClaiming", "billGone", "needsBill", "needsPerson", "badDate"] as const;
export type AskUnsupported = (typeof ASK_UNSUPPORTED)[number];

export type AskNote =
  | { readonly kind: "handoff"; readonly text: string; readonly href: string; readonly carries: boolean }
  | { readonly kind: "square"; readonly other: PersonView; readonly group: BillGroupRef | null }
  | { readonly kind: "awaiting"; readonly other: PersonView; readonly group: BillGroupRef; readonly amount: Cents; readonly currency: CurrencyCode }
  | {
      readonly kind: "wrongWay";
      readonly other: PersonView;
      readonly group: BillGroupRef;
      readonly amount: Cents;
      readonly currency: CurrencyCode;
      readonly theyOwe: boolean;
    }
  | { readonly kind: "nobodyOwes"; readonly other: PersonView | null }
  | { readonly kind: "noPending"; readonly other: PersonView | null }
  | { readonly kind: "allClaimed"; readonly bill: ActionBill }
  | { readonly kind: "noChange"; readonly bill: ActionBill }
  | { readonly kind: "unsupported"; readonly reason: AskUnsupported; readonly bill: ActionBill | null; readonly group: BillGroupRef | null };

export interface AskActionView {
  readonly id: string;
  readonly card: AskActionCard;
}

export interface AskActionEdits {
  readonly amount: number | null;
  readonly skip: readonly string[];
  readonly decision: AskDecision | null;
}

export interface AskActionOutcome {
  readonly kind: AskActionKind;
  readonly names: readonly string[];
  readonly amount: Cents | null;
  readonly pending: boolean;
  readonly decision: AskDecision | null;
  readonly canUndo: boolean;
}

export type AskGone = { readonly kind: "note"; readonly note: AskNote } | { readonly kind: "denied"; readonly denied: AskDenied };

export type AskActResult =
  | { readonly state: "done"; readonly outcome: AskActionOutcome; readonly quota: Allowance }
  | { readonly state: "stale"; readonly action: AskActionView; readonly quota: Allowance }
  | { readonly state: "gone"; readonly gone: AskGone; readonly quota: Allowance }
  | { readonly state: "limit"; readonly quota: Allowance };
