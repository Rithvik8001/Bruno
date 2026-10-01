import "server-only";
import MonthlySummaryEmail, { monthlySummarySubject, monthlySummaryText } from "@/emails/monthly-summary";
import SettleReminderEmail, { settleReminderSubject, settleReminderText } from "@/emails/settle-reminder";
import { routes } from "@/lib/auth/rules";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId as toGroupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { loadDetailedLedger } from "@/lib/ledger/load";
import { cents, sumCents, type Cents } from "@/lib/money";
import { firstNameOf, parseTint } from "@/lib/people/defaults";
import { appUrl } from "@/lib/site";
import { deliver, markSkipped } from "../deliver";
import { emailPerson } from "../format";
import type { EmailRecipient } from "../recipients";
import { monthKeyIn, type MonthRef } from "./clock";
import { monthRecap } from "./monthly";
import { openDebts, owedLines, type OwedEntry } from "./weekly";

interface GroupFacts {
  readonly id: GroupId;
  readonly name: string;
  readonly tint: string;
}

async function groupsOf(personId: string): Promise<GroupFacts[]> {
  const rows = await db.groupMember.findMany({
    where: { personId, leftAt: null, group: { deletedAt: null } },
    select: { group: { select: { id: true, name: true, tint: true } } },
  });
  return rows.map(({ group }) => ({ id: toGroupId(group.id), name: group.name, tint: group.tint }));
}

async function peopleBy(ids: readonly string[]) {
  const rows = await db.person.findMany({ where: { id: { in: [...ids] } }, select: { id: true, displayName: true, tint: true } });
  return new Map(rows.map((row) => [row.id, row]));
}

function totalsLabel(entries: readonly { readonly currency: CurrencyCode; readonly amount: Cents }[]): string {
  const byCurrency = new Map<CurrencyCode, Cents[]>();
  for (const entry of entries) byCurrency.set(entry.currency, [...(byCurrency.get(entry.currency) ?? []), entry.amount]);
  return [...byCurrency].map(([currency, amounts]) => formatMoney(sumCents(amounts), currency)).join(" + ");
}

function byCreditor(entries: readonly OwedEntry[]): Map<string, OwedEntry[]> {
  const result = new Map<string, OwedEntry[]>();
  for (const entry of entries) result.set(entry.other, [...(result.get(entry.other) ?? []), entry]);
  return result;
}

export async function sendWeeklyNudge(recipient: EmailRecipient, dedupeKey: string, now: Date): Promise<boolean> {
  const me: PersonId = recipient.personId;
  const groups = await groupsOf(me);
  const ledger = await loadDetailedLedger(groups.map((group) => group.id));
  const entries = openDebts(
    me,
    groups.map((group) => group.id),
    ledger,
    now,
  );
  if (entries.length === 0) {
    await markSkipped(me, dedupeKey);
    return false;
  }

  const creditors = byCreditor(entries);
  const people = await peopleBy([...creditors.keys()]);
  const nameOf = (id: string) => firstNameOf(people.get(id)?.displayName ?? "") || "Someone";
  const groupName = new Map(groups.map((group) => [group.id, group.name]));
  const titles = new Map(ledger.bills.map((bill) => [bill.billId, bill.title]));

  const only = entries.length === 1 ? entries[0] : undefined;
  const billLines = only
    ? owedLines(me, only, ledger, titles, now).map((line) => ({
        label: `${line.title} · ${groupName.get(only.groupId) ?? ""}`,
        amount: formatMoney(line.amount, only.currency),
        cents: line.amount,
      }))
    : [];
  const linesMatch = only !== undefined && billLines.length > 0 && sumCents(billLines.map((line) => line.cents)) === only.amount;

  const props = {
    creditors: [...creditors].map(([id, owed]) => ({ label: nameOf(id), amount: totalsLabel(owed) })),
    bills: linesMatch
      ? billLines.map(({ label, amount }) => ({ label, amount }))
      : entries.map((entry) => ({
          label: `${nameOf(entry.other)} · ${groupName.get(entry.groupId) ?? ""}`,
          amount: formatMoney(entry.amount, entry.currency),
        })),
    total: totalsLabel(entries),
    settleUrl: appUrl(only ? routes.settle(only.groupId, only.other) : routes.app),
  };
  return deliver({
    kind: "weeklyNudge",
    recipient,
    dedupeKey,
    build: (chrome) => ({
      subject: settleReminderSubject(props),
      react: SettleReminderEmail({ ...props, chrome }),
      text: settleReminderText({ ...props, chrome }),
    }),
  });
}

const togetherLine = (bills: number, balance: Cents, currency: CurrencyCode) =>
  `${bills} ${bills === 1 ? "bill" : "bills"} together. ${
    balance === 0 ? "You’re all square." : `You’re ${formatMoney(cents(Math.abs(balance)), currency)} away from even.`
  }`;

export async function sendMonthlyRecap(recipient: EmailRecipient, dedupeKey: string, month: MonthRef, now: Date): Promise<boolean> {
  const me: PersonId = recipient.personId;
  const groups = await groupsOf(me);
  const ledger = await loadDetailedLedger(groups.map((group) => group.id));
  const recap = monthRecap(me, ledger, month.key, (date) => monthKeyIn(recipient.timeZone, date), now);
  if (!recap) {
    await markSkipped(me, dedupeKey);
    return false;
  }

  const groupFacts = new Map(groups.map((group) => [group.id, group]));
  const largest = recap.groups[0]?.amount ?? cents(0);
  const topPerson = recap.top ? (await peopleBy([recap.top.personId])).get(recap.top.personId) : undefined;
  const props = {
    month: month.label,
    billCount: recap.billCount,
    share: formatMoney(recap.share, recap.currency),
    settled: formatMoney(recap.settled, recap.currency),
    groupCount: recap.groups.length,
    groups: recap.groups.flatMap((entry) => {
      const group = groupFacts.get(entry.groupId);
      if (!group) return [];
      return [
        {
          name: group.name,
          amount: formatMoney(entry.amount, recap.currency),
          tint: parseTint(group.tint, group.name),
          percent: largest > 0 ? (entry.amount / largest) * 100 : 0,
        },
      ];
    }),
    top:
      recap.top && topPerson
        ? {
            person: emailPerson(topPerson),
            name: firstNameOf(topPerson.displayName),
            line: togetherLine(recap.top.bills, recap.top.balance, recap.currency),
          }
        : null,
    activityUrl: appUrl(routes.activity),
  };
  return deliver({
    kind: "monthlyRecap",
    recipient,
    dedupeKey,
    build: (chrome) => ({
      subject: monthlySummarySubject(props.month),
      react: MonthlySummaryEmail({ ...props, chrome }),
      text: monthlySummaryText({ ...props, chrome }),
    }),
  });
}
