"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defineAction } from "@/lib/actions/action";
import { actionOk } from "@/lib/actions/errors";
import { db } from "@/lib/db";
import { profileSchema } from "./schema";

export const saveProfile = defineAction(profileSchema, async (input, { session, person }) => {
  await db.$transaction([
    db.person.update({
      where: { id: person.id },
      data: { displayName: input.displayName, buddy: input.buddy, tint: input.tint },
    }),
    db.user.update({ where: { id: session.user.id }, data: { name: input.displayName } }),
  ]);
  revalidatePath("/", "layout");
  return actionOk({ id: person.id });
});

export const completeOnboarding = defineAction(z.object({}), async (_input, { person }) => {
  await db.person.update({ where: { id: person.id }, data: { onboardedAt: new Date() } });
  return actionOk({ id: person.id });
});
