import type { BillChangeField } from "@/lib/bills/diff";
import type { ClaimedItem } from "@/lib/bills/messages";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { CurrencyCode } from "@/lib/currency";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";

export const FEED_FILTERS = ["all", "you", "payments"] as const;
export type FeedFilter = (typeof FEED_FILTERS)[number];

export interface FeedCursor {
  readonly at: string;
  readonly id: string;
}

export type MemberJoinVia = "joined" | "started" | "added" | "guest" | "claimed" | "linked";

export type FeedAmountSign = "in" | "out" | "neutral";

export interface FeedAmount {
  readonly cents: Cents;
  readonly currency: CurrencyCode;
  readonly sign: FeedAmountSign;
}

interface FeedBase {
  readonly id: string;
  readonly at: Date;
  readonly group: BillGroupRef;
  readonly actor: PersonView | null;
  readonly moment: MomentIconId;
  readonly tint: PaletteTint;
  readonly href: string | null;
  readonly amount: FeedAmount | null;
}

export type FeedEvent =
  | { readonly kind: "billAdded"; readonly title: string }
  | { readonly kind: "billEdited"; readonly title: string; readonly fields: readonly BillChangeField[] }
  | { readonly kind: "billDeleted"; readonly title: string }
  | { readonly kind: "billClaiming"; readonly title: string; readonly reopened: boolean }
  | { readonly kind: "billClaimed"; readonly title: string; readonly items: readonly ClaimedItem[] }
  | { readonly kind: "claimsReminded"; readonly title: string; readonly count: number }
  | { readonly kind: "payment"; readonly from: PersonView | null; readonly to: PersonView | null; readonly pending: boolean }
  | { readonly kind: "paymentConfirmed"; readonly from: PersonView | null; readonly to: PersonView | null }
  | {
      readonly kind: "paymentCancelled";
      readonly from: PersonView | null;
      readonly to: PersonView | null;
      readonly declined: boolean;
    }
  | {
      readonly kind: "memberJoined";
      readonly person: PersonView | null;
      readonly via: MemberJoinVia;
      readonly fromGuest: PersonView | null;
    }
  | { readonly kind: "memberLeft"; readonly person: PersonView | null; readonly removed: boolean };

export type FeedItem = FeedBase & FeedEvent;

export type FeedKind = FeedEvent["kind"];

export interface FeedPage {
  readonly items: readonly FeedItem[];
  readonly nextCursor: FeedCursor | null;
}
