"use server";

import { revalidatePath } from "next/cache";
import { defineAction, definePublicAction } from "@/lib/actions/action";
import { actionFail, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { consumeRate } from "@/lib/rate-limit/limiter";
import type { NotificationCategory } from "./kinds";
import { notificationMessages } from "./messages";
import { writeNotificationPref } from "./prefs";
import { emailTokenSchema, notificationPrefSchema } from "./schema";
import { readLockToken, readUnsubscribeToken } from "./tokens";

export interface SavedPref {
  readonly category: NotificationCategory;
  readonly enabled: boolean;
}

export const setNotificationPref = defineAction(notificationPrefSchema, async ({ category, enabled }, { person }) => {
  const verdict = await consumeRate("notifyPref", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  await writeNotificationPref(person.id, category, enabled);
  revalidatePath(routes.settings);
  return actionOk<SavedPref>({ category, enabled });
});

export const unsubscribe = definePublicAction(emailTokenSchema, async ({ token }) => {
  const verdict = await consumeRate("unsubscribe", null);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  const claims = readUnsubscribeToken(token);
  if (!claims) return actionFail("invalid", notificationMessages.linkExpired);
  await writeNotificationPref(claims.personId, claims.category, false);
  revalidatePath(routes.settings);
  return actionOk<SavedPref>({ category: claims.category, enabled: false });
});

export interface LockedAccount {
  readonly email: string;
}

export const lockAccount = definePublicAction(emailTokenSchema, async ({ token }) => {
  const verdict = await consumeRate("lockAccount", null);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  const claims = readLockToken(token);
  if (!claims) return actionFail("invalid", notificationMessages.lockExpired);
  const user = await db.user.findUnique({ where: { id: claims.userId }, select: { id: true, email: true } });
  if (!user) return actionFail("invalid", notificationMessages.lockExpired);
  const context = await auth.$context;
  await context.internalAdapter.deleteUserSessions(user.id);
  return actionOk<LockedAccount>({ email: user.email });
});
