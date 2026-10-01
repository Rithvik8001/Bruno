import "server-only";
import type { PersonId } from "@/lib/domain/ids";
import type { AskPick } from "../../result";
import type { AskIntent } from "../intent";
import { ASK_PORTIONS, isBillAction, type AskPortion } from "../kinds";
import { billOptions, buildBillChange } from "./bill";
import { buildRecordPayment, buildSettlePending } from "./payments";
import { buildRemindClaims, buildRemindDebts } from "./reminders";
import { unsupported, type BuildEnv, type Built } from "./shared";

export type { BuildEnv, Built, ExecPlan } from "./shared";

const isPortion = (value: string): value is AskPortion => (ASK_PORTIONS as readonly string[]).includes(value);

export function applyPick(intent: AskIntent, pick: AskPick): AskIntent {
  switch (pick.slot) {
    case "group":
      return { ...intent, groupId: pick.ref };
    case "bill":
      return intent.billIds.includes(pick.ref) ? { ...intent, billId: pick.ref } : intent;
    case "amount":
      return isPortion(pick.ref) ? { ...intent, portion: pick.ref } : intent;
    case "payment":
      return { ...intent, settlementId: pick.ref };
    case "person":
    case "period":
      return intent;
  }
}

async function billFor(viewer: PersonId, intent: AskIntent): Promise<{ billId: string } | Built> {
  if (intent.billId !== null) return { billId: intent.billId };
  const options = await billOptions(viewer, intent.billIds);
  const [only] = options;
  if (!only) return unsupported(intent.billIds.length === 0 ? "needsBill" : "billGone");
  if (options.length === 1) return { billId: only.ref };
  return { kind: "clarify", question: { slot: "bill", options }, intent: { ...intent, billIds: options.map((option) => option.ref) } };
}

export async function buildAction(viewer: PersonId, intent: AskIntent, env: BuildEnv): Promise<Built> {
  if (intent.action === "remindDebts") return buildRemindDebts(viewer, intent, env);
  if (intent.action === "recordPayment") return buildRecordPayment(viewer, intent, env);
  if (intent.action === "settlePending") return buildSettlePending(viewer, intent, env);
  if (!isBillAction(intent.action)) return unsupported("generic");
  const target = await billFor(viewer, intent);
  if ("kind" in target) return target;
  if (intent.action === "remindClaims") return buildRemindClaims(viewer, intent, target.billId);
  return buildBillChange(viewer, intent, intent.action, target.billId, env);
}
