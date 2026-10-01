import "server-only";
import { z } from "zod";
import { parseActivityPayload } from "@/lib/activity";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { describeEvent, payloadPeople, payloadSettlement } from "@/lib/feed/describe";
import { HIDDEN_TYPES, peopleById, settlementFacts } from "@/lib/feed/queries";
import { cents } from "@/lib/money";
import { personSelect, toPersonView } from "@/lib/people/person";
import type { AskContext, AskGroup } from "../account";
import type { ActivityCard, AskActivityEvent, AskChange, EmptyCard } from "../result";
import { ASK_EVENTS_MAX } from "../rules";
import { defineTool, fail, groupAt, groupsFor, money, nameOf, personAt, scopeOf, short, sourceOf, stepOf } from "./shared";

const inputSchema = z.object({
  bill: z.string().nullable().describe("A bill ref from findBills (b1, b2...), or null"),
  group: z.number().int().nullable().describe("Group index for the group's recent activity, or null"),
  actor: z.number().int().nullable().describe("Only things this person did, or null"),
});

function changeOf(type: string, payload: unknown): AskChange | null {
  if (type !== "BILL_UPDATED") return null;
  const parsed = parseActivityPayload("BILL_UPDATED", payload);
  if (!parsed || parsed.totalBefore === undefined || parsed.totalAfter === undefined || parsed.currency === undefined) return null;
  return { before: cents(parsed.totalBefore), after: cents(parsed.totalAfter), currency: parsed.currency };
}

const sinceJoined = (groups: readonly AskGroup[]) => groups.map((group) => ({ groupId: group.id as string, createdAt: { gte: group.joinedAt } }));

export const historyTool = defineTool({
  name: "history",
  description: "Who did what and when: edits, claims, payments and members. Pass a bill ref for one bill's history, or a group index for the group's recent activity.",
  inputSchema,
  step: (ctx: AskContext, input) =>
    stepOf("history", { a: nameOf(personAt(ctx, input.actor)), group: groupAt(ctx, input.group)?.ref.name ?? null, title: input.bill ? (ctx.found.get(input.bill)?.title ?? null) : null }),
  run: async (ctx, input) => {
    const found = input.bill === null ? null : (ctx.found.get(input.bill) ?? null);
    if (input.bill !== null && !found) return fail("unknown bill ref: call findBills first");
    const group = found ? (ctx.account.groups.find((g) => g.id === found.groupId) ?? null) : groupAt(ctx, input.group);
    if ((input.group !== null || found) && !group) return fail("unknown group index");
    const actor = personAt(ctx, input.actor);
    if (input.actor !== null && !actor) return fail("unknown person index");
    const groups = group ? [group] : ctx.account.groups;
    if (groups.length === 0) return fail("no groups");

    const rows = await db.activityEvent.findMany({
      where: {
        AND: [
          { OR: sinceJoined(groups) },
          { type: { notIn: [...HIDDEN_TYPES] } },
          found ? { billId: found.id } : {},
          actor ? { actorId: actor.id } : {},
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: ASK_EVENTS_MAX,
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
        actor: { select: personSelect },
        groupId: true,
        bill: { select: { slug: true, deletedAt: true } },
      },
    });
    const [people, settlements] = await Promise.all([
      peopleById(rows.flatMap((row) => payloadPeople(row.type, row.payload))),
      settlementFacts(
        rows.flatMap((row) => payloadSettlement(row.type, row.payload) ?? []),
        ctx.now,
      ),
    ]);
    const events = rows.flatMap((row): AskActivityEvent[] => {
      const ref = groups.find((g) => g.id === row.groupId)?.ref;
      if (!ref) return [];
      const item = describeEvent(
        { id: row.id, type: row.type, payload: row.payload, at: row.createdAt, actor: row.actor ? toPersonView(row.actor) : null, group: ref, bill: row.bill },
        { you: ctx.account.you, people, settlements },
      );
      return item ? [{ feed: { ...item, at: item.at.toISOString() }, change: changeOf(row.type, row.payload) }] : [];
    });

    const pick = group ? { groups: [group], all: false } : (groupsFor(ctx, null) ?? { groups: [], all: true });
    if (events.length === 0) {
      const card: EmptyCard = { kind: "empty", about: "activity", scope: scopeOf(pick, null, null, null), checked: 0, other: actor, title: found ? short(found.title) : null };
      return { card, summary: { empty: true } };
    }
    const entry = found ? ctx.billsById.get(found.id) : undefined;
    const card: ActivityCard = {
      kind: "activity",
      bill: found
        ? {
            title: found.title,
            href: found.finalized ? routes.bill(found.slug) : found.claimCode ? routes.claimBill(found.claimCode) : null,
            total: entry ? { amount: entry.total, currency: entry.currency } : null,
          }
        : null,
      group: group?.ref ?? null,
      actor,
      events,
      source: sourceOf(found ? 1 : 0, 0, group ? [group.ref.name] : []),
    };
    return {
      card,
      summary: {
        bill: found ? short(found.title) : null,
        events: events.slice(0, 6).map((event) => ({
          who: nameOf(event.feed.actor),
          what: event.feed.kind,
          at: event.feed.at.slice(0, 10),
          change: event.change ? `${money(event.change.before, event.change.currency)} to ${money(event.change.after, event.change.currency)}` : null,
        })),
      },
    };
  },
});
