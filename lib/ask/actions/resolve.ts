import "server-only";
import { localDay } from "@/lib/dates";
import { db } from "@/lib/db";
import type { PersonId } from "@/lib/domain/ids";
import type { AskStatus } from "@/lib/generated/prisma/enums";
import type { AskReply } from "../result";
import { buildAction, type BuildEnv, type Built } from "./build";
import type { AskIntent } from "./intent";
import { createAction, maybeSweepActions } from "./store";

export interface Resolved {
  readonly reply: AskReply;
  readonly status: AskStatus;
  readonly outcome: string;
  readonly shown: string | null;
  readonly intent: AskIntent | null;
}

export interface ResolveMeta {
  readonly questionId: string | null;
  readonly threadId: string | null;
}

export const buildEnv = (timeZone: string, now: Date = new Date()): BuildEnv => ({ now, today: localDay(timeZone, now) });

export async function settleBuilt(viewer: PersonId, built: Built, env: BuildEnv, meta: ResolveMeta): Promise<Resolved> {
  switch (built.kind) {
    case "ready": {
      const id = await createAction(db, { personId: viewer, ...meta, intent: built.intent, fingerprint: built.fingerprint, now: env.now });
      maybeSweepActions();
      return { reply: { kind: "action", action: { id, card: built.card } }, status: "PROPOSED", outcome: built.intent.action, shown: `a card proposing ${built.intent.action}, waiting for the user to confirm`, intent: null };
    }
    case "clarify":
      return { reply: { kind: "clarify", questions: [built.question] }, status: "CLARIFY", outcome: "clarify", shown: null, intent: built.intent };
    case "note":
      return { reply: { kind: "note", note: built.note }, status: "DECLINED", outcome: `note:${built.note.kind}`, shown: null, intent: null };
    case "denied":
      return { reply: { kind: "denied", denied: built.denied }, status: "DECLINED", outcome: "denied", shown: null, intent: null };
  }
}

export async function resolveIntent(viewer: PersonId, intent: AskIntent, env: BuildEnv, meta: ResolveMeta): Promise<Resolved> {
  return settleBuilt(viewer, await buildAction(viewer, intent, env), env, meta);
}
