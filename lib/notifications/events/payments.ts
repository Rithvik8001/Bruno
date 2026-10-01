import "server-only";
import PaymentReceivedEmail, { paymentReceivedSubject, paymentReceivedText } from "@/emails/payment-received";
import PaymentUpdateEmail, { paymentUpdateSubject, paymentUpdateText, type PaymentUpdate } from "@/emails/payment-update";
import { routes } from "@/lib/auth/rules";
import { formatMoney, isCurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { paymentMethodLabels } from "@/lib/settlements/messages";
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
      method: true,
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
    groupName: row.group.name,
    amount: formatMoney(cents(row.amountCents), row.currency),
    method: paymentMethodLabels[row.method],
    balancesUrl: appUrl(routes.groupTab(row.groupId, "balances")),
  };
}

type LoadedSettlement = NonNullable<Awaited<ReturnType<typeof loadSettlement>>>;

async function sendUpdate(settlement: LoadedSettlement, update: PaymentUpdate, toPersonId: string): Promise<void> {
  const recipient = await emailRecipient(toPersonId, "payments");
  if (!recipient) return;
  const other = toPersonId === settlement.fromId ? settlement.to : settlement.from;
  const otherId = toPersonId === settlement.fromId ? settlement.toId : settlement.fromId;
  const props = {
    update,
    otherName: firstNameOf(other.displayName),
    amount: settlement.amount,
    groupName: settlement.groupName,
    method: settlement.method,
    date: emailMoment(settlement.createdAt, recipient.timeZone),
    actionUrl: update === "declined" ? appUrl(routes.settle(settlement.groupId, otherId)) : settlement.balancesUrl,
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
  const props = {
    fromName: firstNameOf(settlement.from.displayName),
    amount: settlement.amount,
    groupName: settlement.groupName,
    method: settlement.method,
    date: emailMoment(settlement.createdAt, recipient.timeZone),
    confirmsOn: pending && settlement.autoConfirmAt ? emailDay(settlement.autoConfirmAt, recipient.timeZone) : null,
    actionUrl: pending ? appUrl(routes.settle(settlement.groupId, settlement.fromId)) : settlement.balancesUrl,
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
