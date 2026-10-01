import "server-only";
import { db } from "@/lib/db";
import { personId, type PersonId } from "@/lib/domain/ids";
import { categoryColumn, type NotificationCategory } from "./kinds";

export interface EmailRecipient {
  readonly personId: PersonId;
  readonly email: string;
  readonly displayName: string;
  readonly timeZone: string | null;
}

export async function emailRecipients(
  personIds: readonly string[],
  category: NotificationCategory | null,
): Promise<EmailRecipient[]> {
  const ids = [...new Set(personIds)];
  if (ids.length === 0) return [];
  const rows = await db.person.findMany({
    where: {
      id: { in: ids },
      mergedIntoId: null,
      user: { emailVerified: true },
      ...(category ? { [categoryColumn[category]]: true } : {}),
    },
    select: { id: true, displayName: true, timeZone: true, user: { select: { email: true } } },
  });
  return rows.flatMap((row) =>
    row.user ? [{ personId: personId(row.id), email: row.user.email, displayName: row.displayName, timeZone: row.timeZone }] : [],
  );
}

export async function emailRecipient(id: string, category: NotificationCategory | null): Promise<EmailRecipient | null> {
  const [recipient] = await emailRecipients([id], category);
  return recipient ?? null;
}
