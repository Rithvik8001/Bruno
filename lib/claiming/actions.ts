"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import ClaimReminderEmail, { claimReminderSubject, claimReminderText } from "@/emails/claim-reminder";
import { activity } from "@/lib/activity";
import { defineAction, definePublicAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { runInBackground } from "@/lib/background";
import { billMessages } from "@/lib/bills/messages";
import {
  admitGuests,
  billColumns,
  checkPeople,
  claimingTotal,
  editAccess,
  freeClaimCode,
  freeSlug,
  loadGroupRoster,
} from "@/lib/bills/persist";
import { createBillSchema } from "@/lib/bills/schema";
import { computeShares } from "@/lib/bills/split";
import { tipFromRow } from "@/lib/bills/rows";
import { itemCreates } from "@/lib/bills/write";
import { formatMoney, isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { canAddBill, canClaim } from "@/lib/domain/permissions";
import { groupId as toGroupId, personId as toPersonId } from "@/lib/domain/ids";
import { issueGuestToken } from "@/lib/members/guest-token";
import { createGuestMember, createPendingGuests } from "@/lib/members/guests";
import { resolveGuests } from "@/lib/members/pending";
import { activeMemberCount } from "@/lib/members/queries";
import { MAX_GROUP_MEMBERS } from "@/lib/members/types";
import { memberMessages } from "@/lib/members/messages";
import { cents } from "@/lib/money";
import { deliverAll } from "@/lib/notifications/deliver";
import { notifyBillShares, notifyClaimingOpened, notifyClaimsComplete } from "@/lib/notifications/events/bills";
import { emailRecipients } from "@/lib/notifications/recipients";
import { firstNameOf } from "@/lib/people/defaults";
import { personSelect } from "@/lib/people/person";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { broadcastBill } from "@/lib/realtime/broadcast";
import type { BillEvent, ClaimSignal } from "@/lib/realtime/topics";
import { refreshGroup } from "@/lib/revalidate";
import { categoryLabel, categoryTint } from "@/lib/scans/categories";
import { consumeScan, keepReceipt, ScanGoneError } from "@/lib/scans/consume";
import { scanMessages } from "@/lib/scans/messages";
import { consumeTellDraft, TellGoneError } from "@/lib/tell/consume";
import { tellMessages } from "@/lib/tell/messages";
import { appUrl } from "@/lib/site";
import { clearGuestSession, readGuestSession, setGuestSession } from "./guest-session";
import { claimMessages } from "./messages";
import { billIdRefSchema, codeRefSchema, joinAsGuestSchema, toggleClaimSchema } from "./schema";
import { resolveClaimer } from "./viewer";
import { claimRest, currentLines, syncClaimedEvent, type ClaimTarget } from "./write";

const claimTargetSelect = {
  id: true,
  title: true,
  status: true,
  createdById: true,
  deletedAt: true,
  groupId: true,
  payerId: true,
  claimCode: true,
  splitMethod: true,
  currency: true,
} as const;

async function claimingByCode(code: string) {
  const bill = await db.bill.findFirst({
    where: { claimCode: code, deletedAt: null, status: "CLAIMING", group: { deletedAt: null } },
    select: claimTargetSelect,
  });
  return bill && bill.groupId ? { ...bill, groupId: bill.groupId } : null;
}

async function managedBill(billId: string, you: string) {
  const bill = await db.bill.findFirst({ where: { id: billId, deletedAt: null }, select: claimTargetSelect });
  if (!bill || !bill.groupId) return null;
  const group = await loadGroupRoster(bill.groupId);
  if (!group) return null;
  const allowed = editAccess(toPersonId(you), { ...bill, groupId: bill.groupId }, group.roster);
  return { bill: { ...bill, groupId: bill.groupId }, allowed };
}

function settle(groupId: string, code: string | null, event: BillEvent, signal?: ClaimSignal): void {
  refreshGroup(groupId);
  refresh();
  if (code) after(() => broadcastBill(code, event, signal));
}

export interface StartedClaiming {
  readonly code: string;
  readonly title: string;
}

export const startClaiming = defineAction(createBillSchema, async (input, { person }) => {
  const group = await loadGroupRoster(input.groupId);
  if (!group) return actionFail("notFound", billMessages.groupGone);
  const me = group.roster.find((m) => m.personId === person.id) ?? null;
  if (!canAddBill(me)) return actionFail("forbidden", billMessages.notMember);
  if (!isCurrencyCode(group.currency)) return actionFail("conflict");
  const currency = group.currency;

  const draft = { ...input, method: "ITEMS" as const, participants: [] };
  const admitted = await admitGuests(draft, input.newGuests, group, person.id);
  if (!admitted.ok) return admitted;
  const fields = checkPeople(draft, admitted.data.allowed);
  if (Object.keys(fields).length > 0) return actionInvalid(fields);
  const total = claimingTotal(draft, currency);
  if (!total.ok) return total;

  const [slug, code] = await Promise.all([freeSlug(draft.title), freeClaimCode()]);
  const bill = await db.$transaction(async (tx) => {
    const receiptScanId = await consumeScan(tx, input.receiptScanId, person.id, input.groupId);
    await consumeTellDraft(tx, input.tellDraftId, person.id, input.groupId);
    const guests = await createPendingGuests(tx, { groupId: input.groupId, addedById: person.id, guests: admitted.data.guests });
    const values = resolveGuests(draft, guests);
    const created = await tx.bill.create({
      data: {
        ...billColumns(values, total.data),
        groupId: input.groupId,
        currency,
        createdById: person.id,
        status: "CLAIMING",
        slug,
        claimCode: code,
        receiptScanId,
        items: { create: itemCreates(values) },
      },
      select: { id: true },
    });
    const events = [
      activity("BILL_CREATED", { title: values.title, total: total.data, currency, itemCount: values.items.length }),
      activity("BILL_CLAIMING_OPENED", { title: values.title, itemCount: values.items.length, reopened: false }),
    ];
    await tx.activityEvent.createMany({
      data: events.map((event) => ({
        groupId: input.groupId,
        billId: created.id,
        actorId: person.id,
        type: event.type,
        payload: event.payload,
      })),
    });
    const target: ClaimTarget = { id: created.id, title: values.title, groupId: input.groupId, payerId: values.payerId };
    const claimants = new Set(values.items.flatMap((item) => item.claimedBy));
    for (const claimant of claimants) await syncClaimedEvent(tx, target, claimant);
    return { ok: true as const, id: created.id };
  }).catch((error: unknown) =>
    error instanceof ScanGoneError
      ? { ok: false as const, message: scanMessages.gone }
      : error instanceof TellGoneError
        ? { ok: false as const, message: tellMessages.gone }
        : Promise.reject(error),
  );
  if (!bill.ok) return actionFail("conflict", bill.message);

  if (input.receiptScanId) after(() => keepReceipt(input.receiptScanId ?? "", bill.id));
  refreshGroup(input.groupId);
  runInBackground("claim invite", () => notifyClaimingOpened(bill.id, person.id));
  return actionOk<StartedClaiming>({ code, title: draft.title });
});

export interface ToggledClaim {
  readonly joined: boolean;
}

export const toggleClaim = definePublicAction(toggleClaimSchema, async ({ code, lineItemId, on }, { viewer }) => {
  const bill = await claimingByCode(code);
  if (!bill) return actionFail("notFound", claimMessages.gone);
  const claimer = await resolveClaimer(bill.groupId, viewer);
  if (!claimer) return actionFail("unauthorized", claimMessages.whoAreYou);
  const access = {
    groupId: toGroupId(bill.groupId),
    createdById: toPersonId(bill.createdById),
    status: bill.status,
    deletedAt: bill.deletedAt,
  };
  if (!canClaim(access, claimer.access)) return actionFail("conflict", claimMessages.gone);
  const verdict = await consumeRate("liveClaim", claimer.person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, claimMessages.tooFast);

  const item = await db.lineItem.findFirst({ where: { id: lineItemId, billId: bill.id }, select: { id: true, name: true } });
  if (!item) return actionFail("notFound", claimMessages.itemGone);

  const joining = claimer.kind === "joining";
  if (joining && (await activeMemberCount(bill.groupId)) >= MAX_GROUP_MEMBERS) {
    return actionFail("conflict", memberMessages.groupFull(MAX_GROUP_MEMBERS));
  }

  const person = claimer.person.id;
  await db.$transaction(async (tx) => {
    if (joining) {
      await tx.groupMember.upsert({
        where: { groupId_personId: { groupId: bill.groupId, personId: person } },
        update: { leftAt: null, role: "MEMBER", joinedAt: new Date(), addedById: null },
        create: { groupId: bill.groupId, personId: person, role: "MEMBER" },
      });
      const draft = activity("MEMBER_JOINED", { personId: person, via: "claimLink" });
      await tx.activityEvent.create({
        data: { groupId: bill.groupId, billId: bill.id, actorId: person, type: draft.type, payload: draft.payload },
      });
    }
    if (on) {
      await tx.claim.upsert({
        where: { lineItemId_personId: { lineItemId: item.id, personId: person } },
        update: {},
        create: { lineItemId: item.id, personId: person },
      });
    } else {
      await tx.claim.deleteMany({ where: { lineItemId: item.id, personId: person } });
    }
    await syncClaimedEvent(tx, bill, person);
  });

  settle(bill.groupId, code, "claims", {
    personId: person,
    name: firstNameOf(claimer.person.displayName),
    item: item.name,
    on,
    joined: joining,
  });
  if (on) runInBackground("claims complete", () => notifyClaimsComplete(bill.id, person));
  return actionOk<ToggledClaim>({ joined: joining });
});

export const joinAsGuest = definePublicAction(joinAsGuestSchema, async ({ code, pick }, { viewer }) => {
  if (viewer) return actionFail("conflict", claimMessages.signedIn);
  const bill = await claimingByCode(code);
  if (!bill) return actionFail("notFound", claimMessages.gone);
  const verdict = await consumeRate("claimJoin", null);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);

  if (pick.kind === "existing") {
    const existing = await db.groupMember.findFirst({
      where: { groupId: bill.groupId, personId: pick.guestId, leftAt: null, person: { userId: null, mergedIntoId: null } },
      select: { person: { select: { displayName: true } } },
    });
    if (!existing) return actionFail("notFound", claimMessages.notGuest);
    await setGuestSession({ personId: pick.guestId, groupId: bill.groupId });
    const signal: ClaimSignal = {
      personId: pick.guestId,
      name: firstNameOf(existing.person.displayName),
      item: null,
      on: false,
      joined: true,
    };
    refresh();
    after(() => broadcastBill(code, "claims", signal));
    return actionOk({ personId: pick.guestId });
  }

  if ((await activeMemberCount(bill.groupId)) >= MAX_GROUP_MEMBERS) {
    return actionFail("conflict", memberMessages.groupFull(MAX_GROUP_MEMBERS));
  }
  const guest = await db.$transaction(async (tx) => {
    const created = await createGuestMember(tx, { groupId: bill.groupId, name: pick.name, addedById: bill.createdById });
    const draft = activity("MEMBER_JOINED", { personId: created.id, via: "claimLink" });
    await tx.activityEvent.create({
      data: { groupId: bill.groupId, billId: bill.id, actorId: created.id, type: draft.type, payload: draft.payload },
    });
    return created;
  });
  await setGuestSession({ personId: guest.id, groupId: bill.groupId });
  settle(bill.groupId, code, "claims", {
    personId: guest.id,
    name: firstNameOf(guest.displayName),
    item: null,
    on: false,
    joined: true,
  });
  return actionOk({ personId: guest.id });
});

export const leaveGuestSession = definePublicAction(codeRefSchema, async () => {
  await clearGuestSession();
  refresh();
  return actionOk({ left: true });
});

export interface GuestTakeover {
  readonly claimPath: string;
}

export const startGuestTakeover = definePublicAction(codeRefSchema, async ({ code }, { viewer }) => {
  if (viewer) return actionFail("conflict", claimMessages.signedIn);
  const bill = await db.bill.findFirst({
    where: { claimCode: code, deletedAt: null, group: { deletedAt: null } },
    select: { groupId: true },
  });
  const session = await readGuestSession();
  if (!bill?.groupId || !session || session.groupId !== bill.groupId) return actionFail("notFound", claimMessages.noSpot);
  const guest = await db.groupMember.findFirst({
    where: { groupId: bill.groupId, personId: session.personId, leftAt: null, person: { userId: null, mergedIntoId: null } },
    select: { personId: true },
  });
  if (!guest) return actionFail("notFound", claimMessages.noSpot);
  const verdict = await consumeRate("guestInvite", guest.personId);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, claimMessages.tooManyTakeovers);

  const token = await issueGuestToken({ personId: guest.personId, groupId: bill.groupId, createdById: guest.personId });
  return actionOk<GuestTakeover>({ claimPath: routes.claimGuest(token) });
});

export const splitRest = defineAction(billIdRefSchema, async ({ billId }, { person }) => {
  const managed = await managedBill(billId, person.id);
  if (!managed || managed.bill.status !== "CLAIMING") return actionFail("notFound", claimMessages.gone);
  if (!managed.allowed) return actionFail("forbidden", claimMessages.cantManage);
  const { bill } = managed;

  const count = await db.$transaction((tx) => claimRest(tx, bill));
  settle(bill.groupId, bill.claimCode, "claims");
  return actionOk({ count });
});

export const finishClaiming = defineAction(billIdRefSchema, async ({ billId }, { person }) => {
  const managed = await managedBill(billId, person.id);
  if (!managed || managed.bill.status !== "CLAIMING") return actionFail("notFound", claimMessages.gone);
  if (!managed.allowed) return actionFail("forbidden", claimMessages.cantManage);
  const { bill } = managed;
  if (!isCurrencyCode(bill.currency)) return actionFail("conflict");
  const currency = bill.currency;
  const verdict = await consumeRate("billWrite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, billMessages.tooManyChanges);

  const charges = await db.bill.findUniqueOrThrow({
    where: { id: bill.id },
    select: { taxCents: true, tipKind: true, tipValue: true, discountCents: true },
  });
  const outcome = await db.$transaction(async (tx) => {
    await claimRest(tx, bill);
    const lines = await currentLines(tx, bill.id);
    const split = computeShares({
      method: "ITEMS",
      taxCents: cents(charges.taxCents),
      tip: tipFromRow(charges),
      discountCents: cents(charges.discountCents),
      items: lines,
      participants: [],
    });
    if (!split.ok) return split;
    const total = split.value.totals.total;
    await tx.billParticipant.deleteMany({ where: { billId: bill.id } });
    await tx.billParticipant.createMany({
      data: [...split.value.shares.keys()].map((participant) => ({ billId: bill.id, personId: participant, shares: 1 })),
    });
    await tx.bill.update({
      where: { id: bill.id },
      data: { status: "FINALIZED", finalizedAt: new Date(), totalCents: total },
    });
    const draft = activity("BILL_FINALIZED", { title: bill.title, total, currency });
    await tx.activityEvent.create({
      data: { groupId: bill.groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload },
    });
    return split;
  });
  if (!outcome.ok) return actionFail("conflict");

  settle(bill.groupId, bill.claimCode, "status");
  runInBackground("bill split", () => notifyBillShares(bill.id, person.id, "split"));
  return actionOk({ slug: (await db.bill.findUniqueOrThrow({ where: { id: bill.id }, select: { slug: true } })).slug });
});

export const reopenClaiming = defineAction(billIdRefSchema, async ({ billId }, { person }) => {
  const managed = await managedBill(billId, person.id);
  if (!managed || managed.bill.status !== "FINALIZED") return actionFail("notFound", billMessages.billGone);
  if (!managed.allowed) return actionFail("forbidden", claimMessages.cantManage);
  const { bill } = managed;
  if (bill.splitMethod !== "ITEMS") return actionFail("conflict", claimMessages.notItems);

  const code = bill.claimCode ?? (await freeClaimCode());
  const itemCount = await db.lineItem.count({ where: { billId: bill.id } });
  await db.$transaction(async (tx) => {
    await tx.bill.update({ where: { id: bill.id }, data: { status: "CLAIMING", finalizedAt: null, claimCode: code } });
    const draft = activity("BILL_CLAIMING_OPENED", { title: bill.title, itemCount, reopened: true });
    await tx.activityEvent.create({
      data: { groupId: bill.groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload },
    });
  });

  settle(bill.groupId, code, "status");
  return actionOk({ code });
});

export interface Reminded {
  readonly count: number;
  readonly names: readonly string[];
}

export const remindClaimers = defineAction(billIdRefSchema, async ({ billId }, { person }) => {
  const managed = await managedBill(billId, person.id);
  if (!managed || managed.bill.status !== "CLAIMING" || !managed.bill.claimCode) {
    return actionFail("notFound", claimMessages.gone);
  }
  if (!managed.allowed) return actionFail("forbidden", claimMessages.cantManage);
  const { bill } = managed;
  const code = managed.bill.claimCode;
  if (!isCurrencyCode(bill.currency)) return actionFail("conflict");
  const currency = bill.currency;
  const verdict = await consumeRate("claimRemind", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, claimMessages.tooManyReminders);

  const [members, items, group] = await Promise.all([
    db.groupMember.findMany({
      where: { groupId: bill.groupId, leftAt: null },
      select: { person: { select: personSelect } },
    }),
    db.lineItem.findMany({
      where: { billId: bill.id },
      orderBy: { position: "asc" },
      select: { name: true, priceCents: true, category: true, claims: { select: { personId: true } } },
    }),
    db.group.findUniqueOrThrow({ where: { id: bill.groupId }, select: { name: true } }),
  ]);
  const claimed = new Set(items.flatMap((item) => item.claims.map((c) => c.personId)));
  const unclaimedPeople = members
    .map(({ person: member }) => member)
    .filter((member) => member.id !== person.id && member.id !== bill.payerId && !claimed.has(member.id));
  const recipients = await emailRecipients(
    unclaimedPeople.map((member) => member.id),
    "bills",
  );
  if (recipients.length === 0) return actionOk<Reminded>({ count: 0, names: [] });

  const props = {
    senderName: firstNameOf(person.displayName),
    billTitle: bill.title,
    groupName: group.name,
    claimedPeople: claimed.size,
    totalPeople: members.length,
    unclaimed: items
      .filter((item) => item.claims.length === 0 && item.priceCents > 0)
      .map((item) => ({
        name: item.name,
        price: formatMoney(cents(item.priceCents), currency),
        category: item.category ? { label: categoryLabel[item.category], tint: categoryTint[item.category] } : null,
      })),
    claimUrl: appUrl(routes.claimBill(code)),
  };
  const stamp = new Date().toISOString().slice(0, 13);
  const sent = await deliverAll(
    recipients.map((recipient) => ({
      kind: "claimReminder" as const,
      recipient,
      dedupeKey: `claim-reminder/${bill.id}/${recipient.personId}/${stamp}`,
      build: (chrome) => ({
        subject: claimReminderSubject(props),
        react: ClaimReminderEmail({ ...props, chrome }),
        text: claimReminderText({ ...props, chrome }),
      }),
    })),
  );
  if (sent === 0) return actionOk<Reminded>({ count: 0, names: [] });
  const targets = recipients.map((recipient) => ({ view: { id: recipient.personId, displayName: recipient.displayName } }));
  const draft = activity("CLAIMS_REMINDED", { title: bill.title, personIds: targets.map((t) => t.view.id) });
  await db.activityEvent.create({
    data: { groupId: bill.groupId, billId: bill.id, actorId: person.id, type: draft.type, payload: draft.payload },
  });
  refreshGroup(bill.groupId);
  return actionOk<Reminded>({ count: targets.length, names: targets.map((t) => firstNameOf(t.view.displayName)) });
});
