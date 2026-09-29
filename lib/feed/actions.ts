"use server";

import { revalidatePath } from "next/cache";
import { defineAction } from "@/lib/actions/action";
import { actionOk } from "@/lib/actions/errors";
import { db } from "@/lib/db";
import { getActivityFeed } from "./queries";
import { emptySchema, loadFeedSchema } from "./schema";

export const loadEarlierActivity = defineAction(loadFeedSchema, async (input, { person }) =>
  actionOk(await getActivityFeed(person.id, { filter: input.filter, cursor: input.cursor })),
);

export const markActivitySeen = defineAction(emptySchema, async (_input, { person }) => {
  await db.person.update({ where: { id: person.id }, data: { activitySeenAt: new Date() } });
  revalidatePath("/", "layout");
  return actionOk(null);
});
