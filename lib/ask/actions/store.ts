import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { AskIntent } from "./intent";
import { ACTION_SWEEP_AFTER_MS, ACTION_TTL_MS } from "./kinds";

type Client = Prisma.TransactionClient | typeof db;

const SWEEP_CHANCE = 0.02;

export const toJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export interface NewAction {
  readonly personId: string;
  readonly questionId: string | null;
  readonly threadId: string | null;
  readonly intent: AskIntent;
  readonly fingerprint: string;
  readonly now: Date;
}

export async function createAction(client: Client, input: NewAction): Promise<string> {
  const row = await client.askAction.create({
    data: {
      personId: input.personId,
      questionId: input.questionId,
      threadId: input.threadId,
      kind: input.intent.action,
      intent: toJson(input.intent),
      fingerprint: input.fingerprint,
      expiresAt: new Date(input.now.getTime() + ACTION_TTL_MS),
    },
    select: { id: true },
  });
  return row.id;
}

export function maybeSweepActions(): void {
  if (Math.random() >= SWEEP_CHANCE) return;
  void db.askAction
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - ACTION_SWEEP_AFTER_MS) } } })
    .catch((error: unknown) => console.error("[ask] action sweep failed", error));
}
