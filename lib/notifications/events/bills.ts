import "server-only";
import BillAddedEmail, { billAddedSubject, billAddedText, type BillAddedStake, type BillAddedVariant } from "@/emails/bill-added";
import ClaimInviteEmail, { claimInviteSubject, claimInviteText } from "@/emails/claim-invite";
import ClaimsCompleteEmail, { claimsCompleteSubject, claimsCompleteText } from "@/emails/claims-complete";
import { routes } from "@/lib/auth/rules";
import { billInputFromRow, billSplitSelect } from "@/lib/bills/rows";
import { computeShares } from "@/lib/bills/split";
import { formatMoney, isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { cents, sumCents, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { pushMessages, pushTags } from "@/lib/push/messages";
import { appUrl } from "@/lib/site";
import { deliverPush } from "@/lib/push/send";
import { deliver, deliverAll } from "../deliver";
import { billDayLabel, emailPerson } from "../format";
import { emailRecipient, emailRecipients } from "../recipients";

const AVATAR_STACK_MAX = 4;
const CLAIM_PUSH_SETTLE_MS = 15_000;
const CLAIM_PUSH_WINDOW_MS = 5 * 60 * 1000;

interface Stake {
  readonly stake: BillAddedStake;
  readonly amount: Cents;
}

export async function notifyBillShares(billId: string, actorId: string, variant: BillAddedVariant): Promise<void> {
  const [bill, actor] = await Promise.all([
    db.bill.findFirst({
      where: { id: billId, deletedAt: null, status: "FINALIZED" },
      select: {
        id: true,
        slug: true,
        title: true,
        payerId: true,
        occurredAt: true,
        currency: true,
        payer: { select: { displayName: true } },
        group: { select: { name: true } },
        ...billSplitSelect,
      },
    }),
    db.person.findUnique({ where: { id: actorId }, select: { displayName: true } }),
  ]);
  if (!bill?.group || !actor || !isCurrencyCode(bill.currency)) return;
  const currency = bill.currency;
  const split = computeShares(billInputFromRow(bill));
  if (!split.ok) return;

  const owing = [...split.value.shares].filter(([person, share]) => person !== bill.payerId && share.total > 0);
  const stakes = new Map<string, Stake>(owing.map(([person, share]) => [person, { stake: "owes", amount: share.total }]));
  const back = sumCents(owing.map(([, share]) => share.total));
  if (back > 0) stakes.set(bill.payerId, { stake: "owed", amount: back });
  stakes.delete(actorId);

  const groupName = bill.group.name;
  const billPath = routes.bill(bill.slug);
  const recipients = await emailRecipients([...stakes.keys()], "bills");
  await deliverAll(
    recipients.flatMap((recipient) => {
      const stake = stakes.get(recipient.personId);
      if (!stake) return [];
      const props = {
        variant,
        stake: stake.stake,
        actorName: firstNameOf(actor.displayName),
        billTitle: bill.title,
        groupName,
        amount: formatMoney(stake.amount, currency),
        total: formatMoney(split.value.totals.total, currency),
        payerName: recipient.personId === bill.payerId ? "You" : firstNameOf(bill.payer.displayName),
        date: billDayLabel(bill.occurredAt),
        billUrl: appUrl(billPath),
      };
      return [
        {
          kind: "billAdded" as const,
          recipient,
          dedupeKey: `bill/${bill.id}/${recipient.personId}`,
          build: (chrome) => ({
            subject: billAddedSubject(props),
            react: BillAddedEmail({ ...props, chrome }),
            text: billAddedText({ ...props, chrome }),
          }),
          push: () => ({
            title: billAddedSubject(props),
            body: variant === "split" ? pushMessages.billSplit(groupName, props.actorName) : pushMessages.billAdded(groupName, props.total),
            path: billPath,
            tag: pushTags.bill(bill.id),
          }),
        },
      ];
    }),
  );
}

async function claimingBill(billId: string) {
  const bill = await db.bill.findFirst({
    where: { id: billId, deletedAt: null, status: "CLAIMING", claimCode: { not: null } },
    select: {
      id: true,
      title: true,
      groupId: true,
      createdById: true,
      currency: true,
      totalCents: true,
      claimCode: true,
      group: { select: { name: true } },
      items: { select: { priceCents: true, claims: { select: { personId: true } } } },
    },
  });
  if (!bill?.group || !bill.groupId || !bill.claimCode || !isCurrencyCode(bill.currency)) return null;
  return { ...bill, group: bill.group, groupId: bill.groupId, claimCode: bill.claimCode, currency: bill.currency };
}

export async function notifyClaimingOpened(billId: string, actorId: string): Promise<void> {
  const bill = await claimingBill(billId);
  if (!bill) return;
  const members = await db.groupMember.findMany({
    where: { groupId: bill.groupId, leftAt: null },
    orderBy: { joinedAt: "asc" },
    select: { person: { select: { id: true, displayName: true, tint: true } } },
  });
  const actor = members.find((member) => member.person.id === actorId)?.person;
  if (!actor) return;
  const others = members.filter((member) => member.person.id !== actorId).map((member) => member.person);
  const claimed = new Set(bill.items.flatMap((item) => item.claims.map((claim) => claim.personId)));
  const claimPath = routes.claimBill(bill.claimCode);
  const props = {
    senderName: firstNameOf(actor.displayName),
    billTitle: bill.title,
    groupName: bill.group.name,
    people: [actor, ...others].slice(0, AVATAR_STACK_MAX).map(emailPerson),
    total: formatMoney(cents(bill.totalCents), bill.currency),
    totalPeople: members.length,
    claimedPeople: claimed.size,
    claimUrl: appUrl(claimPath),
  };
  const recipients = await emailRecipients(
    others.map((person) => person.id),
    "bills",
  );
  await deliverAll(
    recipients.map((recipient) => ({
      kind: "claimInvite" as const,
      recipient,
      dedupeKey: `claim-open/${bill.id}/${recipient.personId}`,
      build: (chrome) => ({
        subject: claimInviteSubject(props),
        react: ClaimInviteEmail({ ...props, chrome }),
        text: claimInviteText({ ...props, chrome }),
      }),
      push: () => ({
        title: pushMessages.claimInviteTitle(props.senderName, props.billTitle, props.groupName),
        body: pushMessages.claimInvite(props.groupName, props.senderName),
        path: claimPath,
        tag: pushTags.bill(bill.id),
        action: pushMessages.claimNow,
      }),
    })),
  );
}

export async function notifyClaimsComplete(billId: string, actorId: string): Promise<void> {
  const bill = await claimingBill(billId);
  if (!bill || bill.createdById === actorId) return;
  const priced = bill.items.filter((item) => item.priceCents > 0);
  if (priced.length === 0 || priced.some((item) => item.claims.length === 0)) return;
  const recipient = await emailRecipient(bill.createdById, "claims");
  if (!recipient) return;
  const props = {
    billTitle: bill.title,
    groupName: bill.group.name,
    total: formatMoney(cents(bill.totalCents), bill.currency),
    claimedPeople: new Set(bill.items.flatMap((item) => item.claims.map((claim) => claim.personId))).size,
    finishUrl: appUrl(routes.claimBill(bill.claimCode)),
  };
  await deliver({
    kind: "claimsComplete",
    recipient,
    dedupeKey: `claims-done/${bill.id}`,
    build: (chrome) => ({
      subject: claimsCompleteSubject(props.billTitle),
      react: ClaimsCompleteEmail({ ...props, chrome }),
      text: claimsCompleteText({ ...props, chrome }),
    }),
    push: () => ({
      title: claimsCompleteSubject(props.billTitle),
      body: pushMessages.claimsComplete(props.groupName, props.total, props.claimedPeople),
      path: routes.claimBill(bill.claimCode),
      tag: pushTags.bill(bill.id),
    }),
  });
}

export async function notifyItemsClaimed(billId: string, claimerId: string): Promise<void> {
  const dedupeKey = `items-claimed/${billId}/${claimerId}/${Math.floor(Date.now() / CLAIM_PUSH_WINDOW_MS)}`;
  if (await db.pushLog.findUnique({ where: { dedupeKey }, select: { id: true } })) return;
  await new Promise((resolve) => setTimeout(resolve, CLAIM_PUSH_SETTLE_MS));
  const bill = await claimingBill(billId);
  if (!bill || bill.createdById === claimerId) return;
  const priced = bill.items.filter((item) => item.priceCents > 0);
  if (priced.length > 0 && priced.every((item) => item.claims.length > 0)) return;
  const count = bill.items.filter((item) => item.claims.some((claim) => claim.personId === claimerId)).length;
  if (count === 0) return;
  const [creator, claimer, members] = await Promise.all([
    db.person.findFirst({ where: { id: bill.createdById, notifyClaims: true }, select: { id: true } }),
    db.person.findUnique({ where: { id: claimerId }, select: { displayName: true } }),
    db.groupMember.count({ where: { groupId: bill.groupId, leftAt: null } }),
  ]);
  if (!creator || !claimer) return;
  const claimedPeople = new Set(bill.items.flatMap((item) => item.claims.map((claim) => claim.personId))).size;
  const name = firstNameOf(claimer.displayName);
  await deliverPush({
    kind: "itemsClaimed",
    personId: creator.id,
    dedupeKey,
    payload: () => ({
      kind: "itemsClaimed",
      title: pushMessages.itemsClaimedTitle(name, count, bill.title),
      body: pushMessages.itemsClaimed(bill.group.name, claimedPeople, members),
      url: routes.claimBill(bill.claimCode),
      tag: pushTags.bill(bill.id),
    }),
  });
}
