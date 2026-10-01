"use server";

import { activity } from "@/lib/activity";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { runInBackground } from "@/lib/background";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/site";
import { groupMessages } from "@/lib/groups/messages";
import { notifyAddedToGroup } from "@/lib/notifications/events/members";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { refreshGroup } from "@/lib/revalidate";
import { hashGuestToken, issueGuestToken } from "./guest-token";
import { createGuestMember } from "./guests";
import { mergeGuestInto } from "./merge";
import { memberMessages } from "./messages";
import { activeGuest, activeMember, activeMemberCount, lookupForGroup } from "./queries";
import { addFoundSchema, claimSchema, guestRefSchema, guestSchema, guestUpdateSchema, lookupSchema } from "./schema";
import { signTicket, verifyTicket } from "./ticket";
import { MAX_GROUP_MEMBERS, type LookupResult } from "./types";

export const lookupPerson = defineAction(lookupSchema, async ({ groupId, query }, { person }) => {
  if (!(await activeMember(groupId, person.id))) return actionFail("forbidden", groupMessages.notMember);
  const verdict = await consumeRate("lookup", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, memberMessages.rateLimited);

  const match = await lookupForGroup(groupId, query);
  if (!match) return actionOk<LookupResult>({ status: "none" });
  if (match.membership === "active") return actionOk<LookupResult>({ status: "member", person: match.person });
  const ticket = signTicket({ actor: person.id, group: groupId, target: match.personId });
  return actionOk<LookupResult>({ status: match.membership === "left" ? "former" : "found", person: match.person, ticket });
});

export const addMember = defineAction(addFoundSchema, async ({ groupId, ticket }, { person }) => {
  if (!(await activeMember(groupId, person.id))) return actionFail("forbidden", groupMessages.notMember);
  const targetId = verifyTicket(ticket, { actor: person.id, group: groupId });
  if (!targetId) return actionFail("invalid", memberMessages.ticketExpired);

  const target = await db.person.findFirst({
    where: { id: targetId, mergedIntoId: null, onboardedAt: { not: null }, user: { emailVerified: true } },
    select: { ...personSelect, memberships: { where: { groupId }, select: { leftAt: true } } },
  });
  if (!target) return actionFail("notFound", memberMessages.ticketExpired);
  const view: PersonView = toPersonView(target);
  const existing = target.memberships[0];
  if (existing && existing.leftAt === null) return actionOk({ person: view, added: false });
  if ((await activeMemberCount(groupId)) >= MAX_GROUP_MEMBERS) {
    return actionFail("conflict", memberMessages.groupFull(MAX_GROUP_MEMBERS));
  }

  await db.$transaction(async (tx) => {
    await tx.groupMember.upsert({
      where: { groupId_personId: { groupId, personId: target.id } },
      update: { leftAt: null, role: "MEMBER", joinedAt: new Date(), addedById: person.id },
      create: { groupId, personId: target.id, role: "MEMBER", addedById: person.id },
    });
    const draft = activity("MEMBER_JOINED", { personId: target.id, via: "added" });
    await tx.activityEvent.create({ data: { groupId, actorId: person.id, type: draft.type, payload: draft.payload } });
  });
  refreshGroup(groupId);
  runInBackground("added to group", () => notifyAddedToGroup(groupId, target.id, person.id));
  return actionOk({ person: view, added: true });
});

export const addGuest = defineAction(guestSchema, async ({ groupId, name, buddy, tint }, { person }) => {
  if (!(await activeMember(groupId, person.id))) return actionFail("forbidden", groupMessages.notMember);
  const verdict = await consumeRate("addGuest", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, memberMessages.tooManyGuests);
  if ((await activeMemberCount(groupId)) >= MAX_GROUP_MEMBERS) {
    return actionFail("conflict", memberMessages.groupFull(MAX_GROUP_MEMBERS));
  }

  const guest = await db.$transaction(async (tx) => {
    const created = await createGuestMember(tx, { groupId, name, addedById: person.id, buddy, tint });
    const draft = activity("MEMBER_JOINED", { personId: created.id, via: "guest" });
    await tx.activityEvent.create({ data: { groupId, actorId: person.id, type: draft.type, payload: draft.payload } });
    return created;
  });
  refreshGroup(groupId);
  return actionOk({ person: toPersonView(guest) });
});

export const updateGuest = defineAction(guestUpdateSchema, async ({ groupId, personId, name, buddy, tint }, { person }) => {
  if (!(await activeMember(groupId, person.id))) return actionFail("forbidden", groupMessages.notMember);
  if (!(await activeGuest(groupId, personId))) return actionFail("forbidden", memberMessages.notGuest);
  const updated = await db.person.update({
    where: { id: personId },
    data: { displayName: name, buddy, tint },
    select: personSelect,
  });
  refreshGroup(groupId);
  return actionOk({ person: toPersonView(updated) });
});

export const createGuestInvite = defineAction(guestRefSchema, async ({ groupId, personId }, { person }) => {
  if (!(await activeMember(groupId, person.id))) return actionFail("forbidden", groupMessages.notMember);
  if (!(await activeGuest(groupId, personId))) return actionFail("forbidden", memberMessages.notGuest);
  const verdict = await consumeRate("guestInvite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, memberMessages.tooManyInvites);

  const token = await issueGuestToken({ personId, groupId, createdById: person.id });
  return actionOk({ url: appUrl(routes.claimGuest(token)) });
});

type ClaimOutcome = { ok: true; groupId: string } | { ok: false; message: string; code: "notFound" | "conflict" };

export const claimGuestSpot = defineAction(claimSchema, async ({ token }, { person }) => {
  const verdict = await consumeRate("claim", null);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  const tokenHash = hashGuestToken(token);
  const now = new Date();

  const outcome = await db.$transaction(
    async (tx): Promise<ClaimOutcome> => {
      const row = await tx.guestToken.findUnique({
        where: { tokenHash },
        select: {
          groupId: true,
          usedAt: true,
          expiresAt: true,
          personId: true,
          person: { select: { userId: true, mergedIntoId: true, displayName: true } },
          group: { select: { deletedAt: true } },
        },
      });
      const dead = { ok: false, code: "notFound", message: memberMessages.claimDead } as const;
      if (!row || row.usedAt || row.expiresAt <= now || row.group.deletedAt) return dead;
      if (row.person.userId !== null || row.person.mergedIntoId !== null) return dead;
      if (row.personId === person.id) return { ok: false, code: "conflict", message: memberMessages.claimSelf };

      const guestMembership = await tx.groupMember.findUnique({
        where: { groupId_personId: { groupId: row.groupId, personId: row.personId } },
        select: { leftAt: true },
      });
      if (!guestMembership || guestMembership.leftAt !== null) return dead;
      const mine = await tx.groupMember.findUnique({
        where: { groupId_personId: { groupId: row.groupId, personId: person.id } },
        select: { id: true },
      });
      if (mine) return { ok: false, code: "conflict", message: memberMessages.claimAlreadyMember };

      const consumed = await tx.guestToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return dead;

      await mergeGuestInto(tx, { guestId: row.personId, claimerId: person.id, groupId: row.groupId });
      const draft = activity("MEMBER_JOINED", { personId: person.id, via: "claim", fromGuestId: row.personId });
      await tx.activityEvent.create({
        data: { groupId: row.groupId, actorId: person.id, type: draft.type, payload: draft.payload },
      });
      return { ok: true, groupId: row.groupId };
    },
    { isolationLevel: "Serializable" },
  );

  if (!outcome.ok) return actionFail(outcome.code, outcome.message);
  refreshGroup(outcome.groupId);
  return actionOk({ groupId: outcome.groupId });
});
