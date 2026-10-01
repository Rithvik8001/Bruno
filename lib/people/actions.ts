"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defineAction } from "@/lib/actions/action";
import { actionOk, actionRateLimited } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { runInBackground } from "@/lib/background";
import type { CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { notifyWelcome } from "@/lib/notifications/events/members";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { defaultCurrencySchema, profileSchema } from "./schema";

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
  runInBackground("welcome", () => notifyWelcome(person.id));
  return actionOk({ id: person.id });
});

export const saveDefaultCurrency = defineAction(defaultCurrencySchema, async ({ currency }, { person }) => {
  const verdict = await consumeRate("prefWrite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  await db.person.update({ where: { id: person.id }, data: { defaultCurrency: currency } });
  revalidatePath(routes.settings);
  revalidatePath(routes.groups);
  return actionOk<{ currency: CurrencyCode }>({ currency });
});
