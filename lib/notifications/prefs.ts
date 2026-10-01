import "server-only";
import { db } from "@/lib/db";
import { categoryColumn, type NotificationCategory, type NotificationPrefs } from "./kinds";

const prefsSelect = {
  notifyBills: true,
  notifyClaims: true,
  notifyPayments: true,
  notifyWeekly: true,
  notifyMonthly: true,
} as const;

export async function getNotificationPrefs(personId: string): Promise<NotificationPrefs> {
  const row = await db.person.findUniqueOrThrow({ where: { id: personId }, select: prefsSelect });
  return {
    bills: row.notifyBills,
    claims: row.notifyClaims,
    payments: row.notifyPayments,
    weekly: row.notifyWeekly,
    monthly: row.notifyMonthly,
  };
}

export async function writeNotificationPref(
  personId: string,
  category: NotificationCategory,
  enabled: boolean,
): Promise<boolean> {
  const { count } = await db.person.updateMany({
    where: { id: personId, mergedIntoId: null },
    data: { [categoryColumn[category]]: enabled },
  });
  return count > 0;
}
