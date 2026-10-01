import type { Allowance } from "@/lib/ai/rules";
import type { SpendBucket } from "@/lib/bills/buckets";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { CurrencyCode } from "@/lib/currency";
import type { FeedItem } from "@/lib/feed/types";
import type { PaymentMethod } from "@/lib/ledger/rules";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { AskDeclineReason } from "./rules";

export interface AskMoney {
  readonly amount: Cents;
  readonly currency: CurrencyCode;
}

export interface AskSource {
  readonly bills: number;
  readonly payments: number;
  readonly groups: readonly string[];
}

export interface AskScope {
  readonly groups: readonly BillGroupRef[];
  readonly all: boolean;
  readonly bucket: SpendBucket | null;
  readonly from: string | null;
  readonly to: string | null;
}

export interface AskBill {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly group: BillGroupRef;
  readonly bucket: SpendBucket | null;
  readonly payer: PersonView;
  readonly total: Cents;
  readonly currency: CurrencyCode;
  readonly share: Cents | null;
  readonly day: string;
}

export interface AskPayment {
  readonly from: PersonView;
  readonly to: PersonView;
  readonly amount: Cents;
  readonly currency: CurrencyCode;
  readonly at: string;
  readonly method: PaymentMethod;
  readonly group: BillGroupRef;
}

export interface BalanceTotal {
  readonly currency: CurrencyCode;
  readonly net: Cents;
  readonly groups: readonly string[];
}

export interface BalanceLine {
  readonly group: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly net: Cents;
  readonly titles: readonly string[];
  readonly bills: number;
  readonly settleHref: string | null;
}

export interface BalanceOpenLine {
  readonly bill: AskBill;
  readonly left: Cents;
}

export interface BalanceCard {
  readonly kind: "balance";
  readonly subject: PersonView;
  readonly other: PersonView;
  readonly mine: boolean;
  readonly all: boolean;
  readonly totals: readonly BalanceTotal[];
  readonly lines: readonly BalanceLine[];
  readonly open: readonly BalanceOpenLine[] | null;
  readonly lastPayment: AskPayment | null;
  readonly overall: readonly AskMoney[] | null;
  readonly source: AskSource;
}

export type WhyEntry =
  | {
      readonly kind: "bill";
      readonly bill: AskBill;
      readonly delta: Cents;
      readonly running: Cents;
    }
  | {
      readonly kind: "payment";
      readonly payment: AskPayment;
      readonly delta: Cents;
      readonly running: Cents;
    };

export interface WhyCard {
  readonly kind: "why";
  readonly subject: PersonView;
  readonly other: PersonView;
  readonly mine: boolean;
  readonly group: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly net: Cents;
  readonly entries: readonly WhyEntry[];
  readonly earlier: { readonly count: number; readonly running: Cents } | null;
  readonly settleHref: string | null;
  readonly source: AskSource;
}

export interface SpendTotal {
  readonly currency: CurrencyCode;
  readonly amount: Cents;
  readonly groupTotal: Cents;
  readonly yourShare: Cents;
  readonly bills: number;
  readonly groups: readonly string[];
}

export type SpendBreakdown =
  | { readonly by: "bucket"; readonly currency: CurrencyCode; readonly parts: readonly { readonly bucket: SpendBucket; readonly amount: Cents }[] }
  | {
      readonly by: "month";
      readonly currency: CurrencyCode;
      readonly parts: readonly { readonly month: string; readonly amount: Cents; readonly on: boolean }[];
    };

export interface SpendCard {
  readonly kind: "spend";
  readonly whose: PersonView | null;
  readonly mine: boolean;
  readonly scope: AskScope;
  readonly totals: readonly SpendTotal[];
  readonly breakdown: SpendBreakdown | null;
  readonly bills: readonly AskBill[];
  readonly billCount: number;
  readonly moreHref: string | null;
  readonly untagged: number;
  readonly source: AskSource;
}

export const RANK_METRICS = ["balance", "net", "spend"] as const;
export type RankMetric = (typeof RANK_METRICS)[number];

export interface RankRow {
  readonly person: PersonView | null;
  readonly group: BillGroupRef | null;
  readonly amount: Cents;
  readonly currency: CurrencyCode;
  readonly bills: number;
  readonly href: string | null;
}

export interface RankCard {
  readonly kind: "rank";
  readonly metric: RankMetric;
  readonly by: "person" | "group";
  readonly subject: PersonView | null;
  readonly mine: boolean;
  readonly scope: AskScope;
  readonly totals: readonly AskMoney[];
  readonly rows: readonly RankRow[];
  readonly source: AskSource;
}

export interface ListFilter extends AskScope {
  readonly payer: PersonView | null;
  readonly involving: PersonView | null;
  readonly title: string | null;
}

export interface ListTotal {
  readonly currency: CurrencyCode;
  readonly amount: Cents;
  readonly bills: number;
  readonly groups: readonly string[];
}

export interface ListCard {
  readonly kind: "list";
  readonly filter: ListFilter;
  readonly totals: readonly ListTotal[];
  readonly bills: readonly AskBill[];
  readonly billCount: number;
  readonly source: AskSource;
}

export interface AskChange {
  readonly before: Cents;
  readonly after: Cents;
  readonly currency: CurrencyCode;
}

export type AskFeedItem = FeedItem extends infer Item ? (Item extends unknown ? Omit<Item, "at"> & { readonly at: string } : never) : never;

export interface AskActivityEvent {
  readonly feed: AskFeedItem;
  readonly change: AskChange | null;
}

export interface ActivityCard {
  readonly kind: "activity";
  readonly bill: { readonly title: string; readonly href: string | null; readonly total: AskMoney | null } | null;
  readonly group: BillGroupRef | null;
  readonly actor: PersonView | null;
  readonly events: readonly AskActivityEvent[];
  readonly source: AskSource;
}

export const EMPTY_ABOUT = ["spend", "list", "activity", "balance"] as const;
export type EmptyAbout = (typeof EMPTY_ABOUT)[number];

export interface EmptyCard {
  readonly kind: "empty";
  readonly about: EmptyAbout;
  readonly scope: AskScope;
  readonly checked: number;
  readonly other: PersonView | null;
  readonly title: string | null;
}

export interface DeclineCard {
  readonly kind: "decline";
  readonly reason: AskDeclineReason;
  readonly person: PersonView | null;
  readonly group: BillGroupRef | null;
  readonly settleHref: string | null;
}

export type AskCard = BalanceCard | WhyCard | SpendCard | RankCard | ListCard | ActivityCard | EmptyCard | DeclineCard;
export type AskCardKind = AskCard["kind"];

export const ASK_PERIODS = ["thisMonth", "lastMonth", "monthBefore", "all"] as const;
export type AskPeriod = (typeof ASK_PERIODS)[number];

export const ASK_SLOTS = ["person", "group", "period"] as const;
export type AskSlot = (typeof ASK_SLOTS)[number];

export type AskClarifyQuestion =
  | { readonly slot: "person"; readonly options: readonly { readonly ref: string; readonly person: PersonView; readonly groups: readonly string[] }[] }
  | {
      readonly slot: "group";
      readonly options: readonly { readonly ref: string; readonly group: BillGroupRef; readonly bills: number; readonly currency: CurrencyCode }[];
    }
  | {
      readonly slot: "period";
      readonly options: readonly { readonly ref: AskPeriod; readonly from: string | null; readonly to: string | null }[];
    };

export interface AskPick {
  readonly slot: AskSlot;
  readonly ref: string;
}

export type AskReply =
  | { readonly kind: "answer"; readonly card: AskCard }
  | { readonly kind: "clarify"; readonly questions: readonly AskClarifyQuestion[] };

export const ASK_TOOLS = ["balance", "explain", "spending", "bills", "findBills", "history"] as const;
export type AskToolName = (typeof ASK_TOOLS)[number];

export interface AskStep {
  readonly tool: AskToolName;
  readonly a: string | null;
  readonly b: string | null;
  readonly group: string | null;
  readonly bucket: SpendBucket | null;
  readonly title: string | null;
}

export interface AskDone {
  readonly reply: AskReply;
  readonly quota: Allowance;
  readonly questionId: string;
  readonly threadId: string;
}

export type AskStreamEvent =
  | { readonly t: "step"; readonly step: AskStep }
  | ({ readonly t: "done" } & AskDone)
  | { readonly t: "error"; readonly code: "unknown" | "rateLimited"; readonly message: string; readonly retryAfter: number | null; readonly quota: Allowance };
