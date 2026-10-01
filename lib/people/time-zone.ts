import "server-only";
import { db } from "@/lib/db";

export async function rememberTimeZone(personId: string, timeZone: string): Promise<void> {
  await db.person.updateMany({
    where: { id: personId, OR: [{ timeZone: null }, { timeZone: { not: timeZone } }] },
    data: { timeZone },
  });
}
