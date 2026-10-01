import "server-only";
import SettleReminderEmail, { settleReminderSubject, settleReminderText } from "@/emails/settle-reminder";
import { routes } from "@/lib/auth/rules";
import { formatMoney } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, personId as toPersonId } from "@/lib/domain/ids";
import { loadDetailedLedger } from "@/lib/ledger/load";
import { sumCents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import { appUrl } from "@/lib/site";
import { deliver } from "../deliver";
import { openDebts, owedLines } from "../digests/weekly";
import { DEBT_REMINDER_GAP_MS } from "../kinds";
import { emailRecipient } from "../recipients";

const KIND = "debtReminder";

export interface DebtPair {
  readonly groupId: string;
  readonly debtorId: string;
}

const prefixOf = (creditorId: string, pair: DebtPair) => `debt-reminder/${pair.groupId}/${creditorId}/${pair.debtorId}/`;

export const debtPairKey = (pair: DebtPair) => `${pair.groupId}:${pair.debtorId}`;

export async function recentDebtReminders(creditorId: string, pairs: readonly DebtPair[], now: Date): Promise<Map<string, Date>> {
  const result = new Map<string, Date>();
  if (pairs.length === 0) return result;
  const rows = await db.emailLog.findMany({
    where: { kind: KIND, personId: { in: [...new Set(pairs.map((pair) => pair.debtorId))] }, createdAt: { gt: new Date(now.getTime() - DEBT_REMINDER_GAP_MS) } },
    orderBy: { createdAt: "asc" },
    select: { dedupeKey: true, createdAt: true },
  });
  for (const pair of pairs) {
    const prefix = prefixOf(creditorId, pair);
    const last = rows.filter((row) => row.dedupeKey.startsWith(prefix)).at(-1);
    if (last) result.set(debtPairKey(pair), new Date(last.createdAt.getTime() + DEBT_REMINDER_GAP_MS));
  }
  return result;
}

export async function notifyDebtReminder(creditorId: string, pair: DebtPair, now: Date = new Date()): Promise<boolean> {
  const recipient = await emailRecipient(pair.debtorId, "weekly");
  if (!recipient) return false;
  const group = await db.group.findFirst({
    where: { id: pair.groupId, deletedAt: null, members: { some: { personId: creditorId, leftAt: null } } },
    select: { name: true, members: { where: { personId: { in: [creditorId, pair.debtorId] }, leftAt: null }, select: { personId: true, person: { select: { displayName: true } } } } },
  });
  const creditor = group?.members.find((member) => member.personId === creditorId);
  if (!group || !creditor || !group.members.some((member) => member.personId === pair.debtorId)) return false;
  if ((await recentDebtReminders(creditorId, [pair], now)).has(debtPairKey(pair))) return false;

  const scope = toGroupId(pair.groupId);
  const debtor = toPersonId(pair.debtorId);
  const ledger = await loadDetailedLedger([pair.groupId]);
  const entry = openDebts(debtor, [scope], ledger, now).find((owed) => owed.other === creditorId);
  if (!entry) return false;

  const titles = new Map(ledger.bills.map((bill) => [bill.billId, bill.title]));
  const lines = owedLines(debtor, entry, ledger, titles, now);
  const matches = lines.length > 0 && sumCents(lines.map((line) => line.amount)) === entry.amount;
  const total = formatMoney(entry.amount, entry.currency);
  const sender = firstNameOf(creditor.person.displayName) || "Someone";
  const props = {
    creditors: [{ label: sender, amount: total }],
    bills: matches ? lines.map((line) => ({ label: `${line.title} · ${group.name}`, amount: formatMoney(line.amount, entry.currency) })) : [{ label: group.name, amount: total }],
    total,
    settleUrl: appUrl(routes.settle(pair.groupId, creditorId)),
    sender,
  };
  return deliver({
    kind: KIND,
    recipient,
    dedupeKey: `${prefixOf(creditorId, pair)}${now.toISOString().slice(0, 10)}`,
    build: (chrome) => ({
      subject: settleReminderSubject(props),
      react: SettleReminderEmail({ ...props, chrome }),
      text: settleReminderText({ ...props, chrome }),
    }),
  });
}
