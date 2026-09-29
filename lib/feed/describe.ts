import { parseActivityPayload, type ActivityType } from "@/lib/activity";
import { routes } from "@/lib/auth/rules";
import { isBillChangeField } from "@/lib/bills/diff";
import type { BillGroupRef } from "@/lib/bills/queries";
import type { CurrencyCode } from "@/lib/currency";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { personId, type PersonId } from "@/lib/domain/ids";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { FeedAmount, FeedEvent, FeedItem, FeedKind } from "./types";

export interface FeedRow {
  readonly id: string;
  readonly type: ActivityType;
  readonly payload: unknown;
  readonly at: Date;
  readonly actor: PersonView | null;
  readonly group: BillGroupRef;
  readonly bill: { readonly slug: string; readonly deletedAt: Date | null } | null;
}

export interface SettlementFacts {
  readonly fromId: PersonId;
  readonly toId: PersonId;
  readonly recordedById: PersonId;
  readonly amount: Cents;
  readonly currency: CurrencyCode;
  readonly pending: boolean;
}

export interface FeedContext {
  readonly you: PersonId;
  readonly people: ReadonlyMap<PersonId, PersonView>;
  readonly settlements: ReadonlyMap<string, SettlementFacts>;
}

const look = {
  billAdded: { moment: "receipt", tint: "violet" },
  billEdited: { moment: "memo", tint: "blue" },
  billDeleted: { moment: "receipt", tint: "red" },
  payment: { moment: "moneybag", tint: "green" },
  paymentConfirmed: { moment: "check", tint: "green" },
  paymentCancelled: { moment: "moneywings", tint: "amber" },
  memberJoined: { moment: "link", tint: "cyan" },
  memberLeft: { moment: "people", tint: "indigo" },
} as const satisfies Record<FeedKind, { moment: MomentIconId; tint: PaletteTint }>;

const groupTab = (group: BillGroupRef, tab: "bills" | "balances" | "members") => routes.groupTab(group.id, tab);

function paymentAmount(facts: { fromId: PersonId; toId: PersonId; amount: Cents; currency: CurrencyCode }, you: PersonId): FeedAmount {
  const sign = facts.toId === you ? "in" : facts.fromId === you ? "out" : "neutral";
  return { cents: facts.amount, currency: facts.currency, sign };
}

function eventOf(row: FeedRow, ctx: FeedContext): { event: FeedEvent; href: string | null; amount: FeedAmount | null } | null {
  const person = (id: string) => ctx.people.get(personId(id)) ?? null;
  const billHref = row.bill && row.bill.deletedAt === null ? routes.bill(row.bill.slug) : groupTab(row.group, "bills");
  switch (row.type) {
    case "BILL_CREATED": {
      const p = parseActivityPayload("BILL_CREATED", row.payload);
      if (!p) return null;
      return {
        event: { kind: "billAdded", title: p.title },
        href: billHref,
        amount: { cents: p.total as Cents, currency: p.currency, sign: "neutral" },
      };
    }
    case "BILL_UPDATED": {
      const p = parseActivityPayload("BILL_UPDATED", row.payload);
      if (!p) return null;
      const fields = p.fields.filter(isBillChangeField);
      if (fields.length === 0) return null;
      return { event: { kind: "billEdited", title: p.title, fields }, href: billHref, amount: null };
    }
    case "BILL_DELETED": {
      const p = parseActivityPayload("BILL_DELETED", row.payload);
      if (!p) return null;
      return { event: { kind: "billDeleted", title: p.title }, href: null, amount: null };
    }
    case "SETTLEMENT_RECORDED": {
      const p = parseActivityPayload("SETTLEMENT_RECORDED", row.payload);
      if (!p) return null;
      const facts = ctx.settlements.get(p.settlementId);
      const from = personId(p.fromId);
      const to = personId(p.toId);
      return {
        event: { kind: "payment", from: person(from), to: person(to), pending: facts?.pending ?? false },
        href: groupTab(row.group, "balances"),
        amount: paymentAmount({ fromId: from, toId: to, amount: p.amount as Cents, currency: p.currency }, ctx.you),
      };
    }
    case "SETTLEMENT_CONFIRMED":
    case "SETTLEMENT_CANCELLED": {
      const p = parseActivityPayload(row.type, row.payload);
      const facts = p ? ctx.settlements.get(p.settlementId) : undefined;
      if (!facts) return null;
      const from = person(facts.fromId);
      const to = person(facts.toId);
      const event: FeedEvent =
        row.type === "SETTLEMENT_CONFIRMED"
          ? { kind: "paymentConfirmed", from, to }
          : { kind: "paymentCancelled", from, to, declined: row.actor?.id === facts.toId && facts.recordedById !== facts.toId };
      const amount = paymentAmount(facts, ctx.you);
      return {
        event,
        href: groupTab(row.group, "balances"),
        amount: event.kind === "paymentCancelled" ? { ...amount, sign: "neutral" } : amount,
      };
    }
    case "MEMBER_JOINED": {
      const p = parseActivityPayload("MEMBER_JOINED", row.payload);
      if (!p) return null;
      return {
        event: { kind: "memberJoined", person: person(p.personId), started: p.via === "created" },
        href: groupTab(row.group, "members"),
        amount: null,
      };
    }
    case "MEMBER_LEFT": {
      const p = parseActivityPayload("MEMBER_LEFT", row.payload);
      if (!p) return null;
      return {
        event: { kind: "memberLeft", person: person(p.personId), removed: row.actor !== null && row.actor.id !== p.personId },
        href: groupTab(row.group, "members"),
        amount: null,
      };
    }
    case "BILL_FINALIZED":
    case "ITEM_CLAIMED":
    case "ITEM_UNCLAIMED":
      return null;
  }
}

export function describeEvent(row: FeedRow, ctx: FeedContext): FeedItem | null {
  const described = eventOf(row, ctx);
  if (!described) return null;
  const { event, href, amount } = described;
  const style =
    event.kind === "memberJoined" && event.started ? { moment: "people" as const, tint: "indigo" as const } : look[event.kind];
  return { id: row.id, at: row.at, group: row.group, actor: row.actor, href, amount, ...style, ...event };
}

export function payloadPeople(type: ActivityType, payload: unknown): readonly string[] {
  switch (type) {
    case "SETTLEMENT_RECORDED": {
      const p = parseActivityPayload("SETTLEMENT_RECORDED", payload);
      return p ? [p.fromId, p.toId] : [];
    }
    case "MEMBER_JOINED":
    case "MEMBER_LEFT": {
      const p = parseActivityPayload(type, payload);
      return p ? [p.personId] : [];
    }
    default:
      return [];
  }
}

export function payloadSettlement(type: ActivityType, payload: unknown): string | null {
  if (type !== "SETTLEMENT_RECORDED" && type !== "SETTLEMENT_CONFIRMED" && type !== "SETTLEMENT_CANCELLED") return null;
  return parseActivityPayload(type, payload)?.settlementId ?? null;
}
