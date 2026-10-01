import "server-only";
import { toGroupRef } from "@/lib/bills/queries";
import { isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { personId, type PersonId } from "@/lib/domain/ids";
import type { Prisma } from "@/lib/generated/prisma/client";
import { countsTowardBalance } from "@/lib/ledger/settlements";
import { cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { describeEvent, payloadPeople, payloadSettlement, type SettlementFacts } from "./describe";
import type { FeedCursor, FeedFilter, FeedItem, FeedPage } from "./types";

const FEED_PAGE_SIZE = 30;
export const HIDDEN_TYPES = ["BILL_FINALIZED", "ITEM_CLAIMED", "ITEM_UNCLAIMED"] as const;
const PAYMENT_TYPES = ["SETTLEMENT_RECORDED", "SETTLEMENT_CONFIRMED", "SETTLEMENT_CANCELLED"] as const;

interface Membership {
  readonly groupId: string;
  readonly joinedAt: Date;
}

async function activeMemberships(you: PersonId): Promise<readonly Membership[]> {
  return db.groupMember.findMany({
    where: { personId: you, leftAt: null, group: { deletedAt: null } },
    select: { groupId: true, joinedAt: true },
  });
}

function scopeOf(memberships: readonly Membership[]): Prisma.ActivityEventWhereInput {
  return {
    OR: memberships.map((m) => ({ groupId: m.groupId, createdAt: { gte: m.joinedAt } })),
    type: { notIn: [...HIDDEN_TYPES] },
  };
}

function filterOf(filter: FeedFilter, you: PersonId): Prisma.ActivityEventWhereInput {
  switch (filter) {
    case "all":
      return {};
    case "payments":
      return { type: { in: [...PAYMENT_TYPES] } };
    case "you":
      return {
        OR: [
          { actorId: you },
          { payload: { path: ["fromId"], equals: you } },
          { payload: { path: ["toId"], equals: you } },
          { payload: { path: ["personId"], equals: you } },
          { bill: { participants: { some: { personId: you } } } },
        ],
      };
  }
}

function cursorOf(cursor: FeedCursor | undefined): Prisma.ActivityEventWhereInput {
  if (!cursor) return {};
  const at = new Date(cursor.at);
  return { OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: cursor.id } }] };
}

export async function settlementFacts(ids: readonly string[], now: Date): Promise<ReadonlyMap<string, SettlementFacts>> {
  if (ids.length === 0) return new Map();
  const rows = await db.settlement.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: {
      id: true,
      fromId: true,
      toId: true,
      recordedById: true,
      amountCents: true,
      currency: true,
      status: true,
      autoConfirmAt: true,
    },
  });
  const facts = new Map<string, SettlementFacts>();
  for (const row of rows) {
    if (!isCurrencyCode(row.currency)) continue;
    facts.set(row.id, {
      fromId: personId(row.fromId),
      toId: personId(row.toId),
      recordedById: personId(row.recordedById),
      amount: cents(row.amountCents),
      currency: row.currency,
      pending: row.status === "PENDING" && !countsTowardBalance({ status: row.status, autoConfirmAt: row.autoConfirmAt }, now),
    });
  }
  return facts;
}

export async function peopleById(ids: readonly string[]): Promise<ReadonlyMap<PersonId, PersonView>> {
  if (ids.length === 0) return new Map();
  const rows = await db.person.findMany({ where: { id: { in: [...new Set(ids)] } }, select: personSelect });
  return new Map(rows.map((row) => [personId(row.id), toPersonView(row)]));
}

export interface FeedQuery {
  readonly filter: FeedFilter;
  readonly cursor?: FeedCursor;
  readonly limit?: number;
}

export async function getActivityFeed(you: PersonId, { filter, cursor, limit = FEED_PAGE_SIZE }: FeedQuery): Promise<FeedPage> {
  const memberships = await activeMemberships(you);
  if (memberships.length === 0) return { items: [], nextCursor: null };

  const rows = await db.activityEvent.findMany({
    where: { AND: [scopeOf(memberships), filterOf(filter, you), cursorOf(cursor)] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      type: true,
      payload: true,
      createdAt: true,
      actor: { select: personSelect },
      group: { select: { id: true, name: true, tint: true, art: true } },
      bill: { select: { slug: true, deletedAt: true } },
    },
  });

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const nextCursor = rows.length > limit && last ? { at: last.createdAt.toISOString(), id: last.id } : null;
  const now = new Date();

  const [people, settlements] = await Promise.all([
    peopleById(page.flatMap((row) => payloadPeople(row.type, row.payload))),
    settlementFacts(
      page.flatMap((row) => payloadSettlement(row.type, row.payload) ?? []),
      now,
    ),
  ]);

  const items = page.flatMap((row): FeedItem[] => {
    if (!row.group) return [];
    const item = describeEvent(
      {
        id: row.id,
        type: row.type,
        payload: row.payload,
        at: row.createdAt,
        actor: row.actor ? toPersonView(row.actor) : null,
        group: toGroupRef(row.group),
        bill: row.bill,
      },
      { you, people, settlements },
    );
    return item ? [item] : [];
  });

  return { items, nextCursor };
}

export async function hasUnreadActivity(you: PersonId): Promise<boolean> {
  const [memberships, person] = await Promise.all([
    activeMemberships(you),
    db.person.findUnique({ where: { id: you }, select: { activitySeenAt: true } }),
  ]);
  if (memberships.length === 0) return false;
  const seenAt = person?.activitySeenAt ?? null;
  const event = await db.activityEvent.findFirst({
    where: {
      AND: [scopeOf(memberships), { NOT: { actorId: you } }, seenAt ? { createdAt: { gt: seenAt } } : {}],
    },
    select: { id: true },
  });
  return event !== null;
}
