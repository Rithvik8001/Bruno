import "server-only";
import PaymentReceivedEmail, { paymentReceivedSubject, paymentReceivedText } from "@/emails/payment-received";
import PaymentUpdateEmail, { paymentUpdateSubject, paymentUpdateText, type PaymentUpdate } from "@/emails/payment-update";
import { routes } from "@/lib/auth/rules";
import { formatMoney, isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { personId as toPersonId, groupId as toGroupId } from "@/lib/domain/ids";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { pairBalance } from "@/lib/ledger/pair";
import { pushMessages, pushTags, type PairStanding } from "@/lib/push/messages";
import { appUrl } from "@/lib/site";
import { deliver } from "../deliver";
import { emailDay, emailMoment } from "../format";
import { emailRecipient } from "../recipients";

async function loadSettlement(settlementId: string) {
  const row = await db.settlement.findUnique({
    where: { id: settlementId },
    select: {
      id: true,
      groupId: true,
      fromId: true,
      toId: true,
      recordedById: true,
      amountCents: true,
      currency: true,
      status: true,
      autoConfirmAt: true,
      createdAt: true,
      from: { select: { displayName: true } },
      to: { select: { displayName: true } },
      group: { select: { name: true } },
    },
  });
  if (!row?.group || !row.groupId || !isCurrencyCode(row.currency)) return null;
  return {
    ...row,
    groupId: row.groupId,
    currency: row.currency,
    groupName: row.group.name,
    amount: formatMoney(cents(row.amountCents), row.currency),
    balancesPath: routes.groupTab(row.groupId, "balances"),
  };
}

type LoadedSettlement = NonNullable<Awaited<ReturnType<typeof loadSettlement>>>;

async function standingOf(settlement: LoadedSettlement, me: string, other: string): Promise<PairStanding> {
  const ledger = await loadGroupLedgers([settlement.groupId]);
  const scope = { groupId: toGroupId(settlement.groupId), currency: settlement.currency };
  const net = pairBalance(toPersonId(me), toPersonId(other), ledger.debts, ledger.settlements, scope, new Date());
  if (net === 0) return { kind: "square" };
  return net > 0
    ? { kind: "theyOwe", amount: formatMoney(net, settlement.currency) }
    : { kind: "youOwe", amount: formatMoney(cents(-net), settlement.currency) };
}

const updateTitles = {
  confirmed: pushMessages.paymentConfirmedTitle,
  received: pushMessages.paymentReceivedByThemTitle,
  cancelled: pushMessages.paymentCancelledTitle,
} as const satisfies Partial<Record<PaymentUpdate, (other: string, amount: string) => string>>;

async function sendUpdate(settlement: LoadedSettlement, update: PaymentUpdate, toPersonId: string): Promise<void> {
  const recipient = await emailRecipient(toPersonId, "payments");
  if (!recipient) return;
  const other = toPersonId === settlement.fromId ? settlement.to : settlement.from;
  const otherId = toPersonId === settlement.fromId ? settlement.toId : settlement.fromId;
  const actionPath = update === "declined" ? routes.settle(settlement.groupId, otherId) : settlement.balancesPath;
  const standing = await standingOf(settlement, toPersonId, otherId);
  const props = {
    update,
    otherName: firstNameOf(other.displayName),
    amount: settlement.amount,
    groupName: settlement.groupName,
    date: emailMoment(settlement.createdAt, recipient.timeZone),
    actionUrl: appUrl(actionPath),
  };
  await deliver({
    kind: "paymentUpdate",
    recipient,
    dedupeKey: `settlement/${settlement.id}/${update}`,
    build: (chrome) => ({
      subject: paymentUpdateSubject(props),
      react: PaymentUpdateEmail({ ...props, chrome }),
      text: paymentUpdateText({ ...props, chrome }),
    }),
    push: () => ({
      title: update === "declined" ? paymentUpdateSubject(props) : updateTitles[update](props.otherName, props.amount),
      body: pushMessages.paymentStanding(props.groupName, props.otherName, standing),
      path: actionPath,
      tag: pushTags.settlement(settlement.id),
    }),
  });
}

export async function notifySettlementRecorded(settlementId: string): Promise<void> {
  const settlement = await loadSettlement(settlementId);
  if (!settlement || settlement.status === "CANCELLED") return;
  if (settlement.recordedById === settlement.toId) {
    await sendUpdate(settlement, "received", settlement.fromId);
    return;
  }
  const recipient = await emailRecipient(settlement.toId, "payments");
  if (!recipient) return;
  const pending = settlement.status === "PENDING" && settlement.autoConfirmAt !== null;
  const actionPath = pending ? routes.settle(settlement.groupId, settlement.fromId) : settlement.balancesPath;
  const props = {
    fromName: firstNameOf(settlement.from.displayName),
    amount: settlement.amount,
    groupName: settlement.groupName,
    date: emailMoment(settlement.createdAt, recipient.timeZone),
    confirmsOn: pending && settlement.autoConfirmAt ? emailDay(settlement.autoConfirmAt, recipient.timeZone) : null,
    actionUrl: appUrl(actionPath),
  };
  await deliver({
    kind: "paymentReceived",
    recipient,
    dedupeKey: `settlement/${settlement.id}/recorded`,
    build: (chrome) => ({
      subject: paymentReceivedSubject(props),
      react: PaymentReceivedEmail({ ...props, chrome }),
      text: paymentReceivedText({ ...props, chrome }),
    }),
    push: () => ({
      title: pushMessages.paymentReceivedTitle(props.fromName, props.amount),
      body: pending ? pushMessages.paymentReceived(props.groupName) : props.groupName,
      path: actionPath,
      tag: pushTags.settlement(settlement.id),
    }),
  });
}

export async function notifySettlementChanged(
  settlementId: string,
  actorId: string,
  update: Exclude<PaymentUpdate, "received">,
): Promise<void> {
  const settlement = await loadSettlement(settlementId);
  if (!settlement) return;
  const target = actorId === settlement.fromId ? settlement.toId : settlement.fromId;
  await sendUpdate(settlement, update, target);
}
