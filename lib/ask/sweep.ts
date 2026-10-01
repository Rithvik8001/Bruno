import "server-only";
import { db } from "@/lib/db";
import { maybeSweepActions } from "./actions/store";
import { ASK_SWEEP_AFTER_MS, ASK_SWEEP_CHANCE } from "./rules";

export async function sweepStaleQuestions(now: Date = new Date()): Promise<void> {
  await db.askQuestion.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - ASK_SWEEP_AFTER_MS) } } });
}

export function maybeSweepAsk(): void {
  maybeSweepActions();
  if (Math.random() >= ASK_SWEEP_CHANCE) return;
  void sweepStaleQuestions().catch((error: unknown) => console.error("[ask] sweep failed", error));
}
