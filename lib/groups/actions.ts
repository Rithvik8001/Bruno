"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { activity, type ActivityType, type ActivityPayload } from "@/lib/activity";
import { defineAction } from "@/lib/actions/action";
import { actionFail, actionOk } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId, type PersonId } from "@/lib/domain/ids";
import {
  canLeaveGroup,
  canManageGroup,
  GROUP_ROLES,
  isLastAdmin,
  type Membership,
} from "@/lib/domain/permissions";
import { balanceOf, inScope, netBalances } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { uniqueSlug } from "@/lib/slug";
import { groupMessages } from "./messages";
import { getGroupInvite, type GroupInvite } from "./queries";
import { groupIdSchema, groupInputSchema } from "./schema";

async function slugFor(name: string): Promise<string> {
  return uniqueSlug(name, async (slug) => (await db.group.count({ where: { slug } })) > 0);
}

async function logActivity<T extends ActivityType>(
  groupId: string,
  actorId: PersonId,
  type: T,
  payload: ActivityPayload<T>,
): Promise<void> {
  const draft = activity(type, payload);
  await db.activityEvent.create({ data: { groupId, actorId, type: draft.type, payload: draft.payload } });
}

async function loadRoster(groupId: string): Promise<Membership[] | null> {
  const group = await db.group.findFirst({
    where: { id: groupId, deletedAt: null },
    select: { members: { select: { personId: true, role: true, leftAt: true } } },
  });
  if (!group) return null;
  return group.members.map((m) => ({
    groupId: toGroupId(groupId),
    personId: toPersonId(m.personId),
    role: m.role,
    leftAt: m.leftAt,
  }));
}

async function groupBalances(groupId: string) {
  const ledger = await loadGroupLedgers([groupId]);
  const scope = toGroupId(groupId);
  return netBalances(inScope(ledger.debts, scope), inScope(ledger.settlements, scope), new Date());
}

function refresh(groupId?: string): void {
  revalidatePath(routes.groups);
  revalidatePath(routes.activity);
  if (groupId) revalidatePath(routes.group(groupId));
}

export const createGroup = defineAction(groupInputSchema, async (input, { person }) => {
  const slug = await slugFor(input.name);
  const group = await db.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: input.name,
        tint: input.tint,
        art: input.art,
        currency: input.currency,
        slug,
        createdById: person.id,
        members: { create: { personId: person.id, role: "ADMIN" } },
      },
      select: { id: true },
    });
    const draft = activity("MEMBER_JOINED", { personId: person.id, via: "created" });
    await tx.activityEvent.create({
      data: { groupId: created.id, actorId: person.id, type: draft.type, payload: draft.payload },
    });
    return created;
  });
  refresh();
  return actionOk({ id: group.id });
});

const updateGroupSchema = groupInputSchema.extend({ groupId: groupIdSchema });

export const updateGroup = defineAction(updateGroupSchema, async ({ groupId, ...input }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id) ?? null;
  if (!roster || !canManageGroup(me)) return actionFail("forbidden", groupMessages.notAdmin);

  const current = await db.group.findUniqueOrThrow({ where: { id: groupId }, select: { currency: true } });
  if (current.currency !== input.currency) {
    const bills = await db.bill.count({ where: { groupId, deletedAt: null } });
    if (bills > 0) return { ok: false, error: { code: "conflict", message: groupMessages.currencyLocked, fields: { currency: groupMessages.currencyLocked } } };
  }

  await db.group.update({
    where: { id: groupId },
    data: { name: input.name, tint: input.tint, art: input.art, currency: input.currency },
  });
  refresh(groupId);
  return actionOk({ id: groupId });
});

const groupRefSchema = z.object({ groupId: groupIdSchema });

export const resetInviteLink = defineAction(groupRefSchema, async ({ groupId }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id) ?? null;
  if (!roster || !canManageGroup(me)) return actionFail("forbidden", groupMessages.notAdmin);
  const group = await db.group.findUniqueOrThrow({ where: { id: groupId }, select: { name: true } });
  const slug = await slugFor(group.name);
  await db.group.update({ where: { id: groupId }, data: { slug } });
  refresh(groupId);
  return actionOk({ slug });
});

const slugSchema = z.object({ slug: z.string().trim().min(1).max(64) });

export const previewInvite = defineAction(slugSchema, async ({ slug }) => {
  const invite: GroupInvite | null = await getGroupInvite(slug);
  if (!invite) return actionFail("notFound", groupMessages.deadLink);
  return actionOk(invite);
});

export const joinGroup = defineAction(slugSchema, async ({ slug }, { person }) => {
  const group = await db.group.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!group) return actionFail("notFound", groupMessages.deadLink);

  const existing = await db.groupMember.findUnique({
    where: { groupId_personId: { groupId: group.id, personId: person.id } },
    select: { leftAt: true },
  });
  if (existing && existing.leftAt === null) return actionOk({ id: group.id });

  await db.groupMember.upsert({
    where: { groupId_personId: { groupId: group.id, personId: person.id } },
    update: { leftAt: null, role: "MEMBER", joinedAt: new Date() },
    create: { groupId: group.id, personId: person.id, role: "MEMBER" },
  });
  await logActivity(group.id, person.id, "MEMBER_JOINED", { personId: person.id, via: "invite" });
  refresh(group.id);
  return actionOk({ id: group.id });
});

export const leaveGroup = defineAction(groupRefSchema, async ({ groupId }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id && m.leftAt === null);
  if (!roster || !me) return actionFail("forbidden", groupMessages.notMember);
  if (roster.filter((m) => m.leftAt === null).length === 1) return actionFail("conflict", groupMessages.onlyMember);
  if (isLastAdmin(roster, person.id)) return actionFail("conflict", groupMessages.lastAdmin);
  if (!canLeaveGroup(balanceOf(await groupBalances(groupId), person.id))) {
    return actionFail("conflict", groupMessages.notSquare);
  }

  await db.groupMember.update({
    where: { groupId_personId: { groupId, personId: person.id } },
    data: { leftAt: new Date() },
  });
  await logActivity(groupId, person.id, "MEMBER_LEFT", { personId: person.id });
  refresh(groupId);
  return actionOk({ id: groupId });
});

const memberRefSchema = groupRefSchema.extend({ personId: z.string().min(1) });

export const removeMember = defineAction(memberRefSchema, async ({ groupId, personId }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id) ?? null;
  if (!roster || !canManageGroup(me)) return actionFail("forbidden", groupMessages.notAdmin);
  const target = roster.find((m) => m.personId === personId && m.leftAt === null);
  if (!target) return actionFail("notFound");
  if (target.personId === person.id) return actionFail("conflict");
  if (!canLeaveGroup(balanceOf(await groupBalances(groupId), target.personId))) {
    return actionFail("conflict", groupMessages.memberNotSquare);
  }

  await db.groupMember.update({ where: { groupId_personId: { groupId, personId } }, data: { leftAt: new Date() } });
  await logActivity(groupId, person.id, "MEMBER_LEFT", { personId });
  refresh(groupId);
  return actionOk({ id: groupId });
});

const roleSchema = memberRefSchema.extend({ role: z.enum(GROUP_ROLES) });

export const setMemberRole = defineAction(roleSchema, async ({ groupId, personId, role }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id) ?? null;
  if (!roster || !canManageGroup(me)) return actionFail("forbidden", groupMessages.notAdmin);
  const target = roster.find((m) => m.personId === personId && m.leftAt === null);
  if (!target) return actionFail("notFound");
  if (role === "MEMBER" && isLastAdmin(roster, target.personId)) return actionFail("conflict", groupMessages.lastAdmin);

  await db.groupMember.update({ where: { groupId_personId: { groupId, personId } }, data: { role } });
  refresh(groupId);
  return actionOk({ id: groupId });
});

export const deleteGroup = defineAction(groupRefSchema, async ({ groupId }, { person }) => {
  const roster = await loadRoster(groupId);
  const me = roster?.find((m) => m.personId === person.id) ?? null;
  if (!roster || !canManageGroup(me)) return actionFail("forbidden", groupMessages.notAdmin);
  const balances = await groupBalances(groupId);
  if (![...balances.values()].every((byPerson) => [...byPerson.values()].every((amount) => amount === 0))) {
    return actionFail("conflict", groupMessages.notSquare);
  }

  await db.group.update({ where: { id: groupId }, data: { deletedAt: new Date() } });
  refresh(groupId);
  return actionOk({ id: groupId });
});
