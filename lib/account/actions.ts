"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { defineAction } from "@/lib/actions/action";
import { actionOk, actionRateLimited, type ActionResult } from "@/lib/actions/errors";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/lib/auth/rules";
import { runInBackground } from "@/lib/background";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { deleteObject } from "@/lib/scans/storage";
import { eraseAccount } from "./delete";
import { accountMessages } from "./messages";
import { sendAccountDeleted } from "./notify";
import { inspectAccount } from "./queries";
import type { DeleteOutcome, DeleteStatus } from "./rules";
import { deleteAccountSchema } from "./schema";

async function clearSessionCookies(): Promise<void> {
  const context = await auth.$context;
  const jar = await cookies();
  const { sessionToken, sessionData, dontRememberToken } = context.authCookies;
  for (const cookie of [sessionToken, sessionData, dontRememberToken]) jar.delete(cookie.name);
}

export const deleteStatus = defineAction(z.object({}), async (_input, { person }) => {
  const verdict = await consumeRate("prefWrite", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  return actionOk<DeleteStatus>((await inspectAccount(person.id)).status);
});

const eraseForViewer = defineAction(deleteAccountSchema, async (_input, { session, person }) => {
  const verdict = await consumeRate("accountDelete", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter, accountMessages.limited);

  const plan = await inspectAccount(person.id);
  if (plan.status.kind === "blocked") return actionOk<DeleteOutcome>({ kind: "blocked", block: plan.status.block });

  const { id: userId, email } = session.user;
  const at = new Date();
  const erased = await eraseAccount({ personId: person.id, userId, email }, plan);
  await clearSessionCookies();

  runInBackground("account deleted", async () => {
    await Promise.allSettled(erased.scanKeys.map((key) => deleteObject(key)));
    await sendAccountDeleted({ userId, email, at, timeZone: erased.timeZone });
  });
  revalidatePath("/", "layout");
  return actionOk<DeleteOutcome>({ kind: "deleted" });
});

export async function deleteAccount(input: { confirm: string }): Promise<ActionResult<DeleteOutcome>> {
  const result = await eraseForViewer(input);
  if (result.ok && result.data.kind === "deleted") redirect(routes.goodbye);
  return result;
}
