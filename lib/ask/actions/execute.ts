import "server-only";
import { actionFail, actionInvalid, actionOk, actionRateLimited, type ActionResult } from "@/lib/actions/errors";
import { deleteBill, updateBill } from "@/lib/bills/actions";
import { finishClaiming, remindClaimers } from "@/lib/claiming/actions";
import { formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import { cents } from "@/lib/money";
import { notifyDebtReminder } from "@/lib/notifications/events/debts";
import { firstNameOf } from "@/lib/people/defaults";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { confirmSettlement, declineSettlement, recordSettlement } from "@/lib/settlements/actions";
import { settlementMessages } from "@/lib/settlements/messages";
import type { Built } from "./build";
import type { AskActionEdits, AskActionOutcome } from "./card";
import { askActionMessages } from "./messages";

export interface Executed {
  readonly outcome: AskActionOutcome;
  readonly settlementId: string | null;
}

type Ready = Extract<Built, { kind: "ready" }>;

const done = (ready: Ready, extra: Partial<Omit<AskActionOutcome, "kind">> = {}, settlementId: string | null = null): ActionResult<Executed> =>
  actionOk({ outcome: { kind: ready.intent.action, names: [], amount: null, pending: false, decision: null, canUndo: false, ...extra }, settlementId });

export async function executeAction(viewer: PersonId, ready: Ready, edits: AskActionEdits): Promise<ActionResult<Executed>> {
  const { exec, card } = ready;
  switch (exec.do) {
    case "remindDebts": {
      if (card.kind !== "remindDebts") return actionFail("conflict");
      const skip = new Set(edits.skip);
      const targets = card.rows.filter((row) => row.blocked === null && !skip.has(row.key));
      if (targets.length === 0) return actionFail("invalid", askActionMessages.pickSomeone);
      const verdict = await consumeRate("debtRemind", viewer);
      if (!verdict.ok) return actionRateLimited(verdict.retryAfter, askActionMessages.tooManyReminders);
      const sent = await Promise.all(targets.map((row) => notifyDebtReminder(viewer, { groupId: row.group.id, debtorId: row.person.id }).catch(() => false)));
      const names = targets.filter((_, index) => sent[index]).map((row) => firstNameOf(row.person.displayName));
      return names.length === 0 ? actionFail("conflict", askActionMessages.notSent) : done(ready, { names });
    }
    case "remindClaims": {
      const result = await remindClaimers({ billId: exec.billId });
      if (!result.ok) return result;
      return result.data.count === 0 ? actionFail("conflict", askActionMessages.notSent) : done(ready, { names: result.data.names });
    }
    case "recordPayment": {
      if (card.kind !== "recordPayment") return actionFail("conflict");
      const amount = edits.amount ?? card.amount;
      if (amount === null || !Number.isSafeInteger(amount) || amount < 1) return actionInvalid({ amountCents: askActionMessages.amountMissing }, askActionMessages.amountMissing);
      if (amount > exec.max) {
        const message = settlementMessages.tooMuch(formatMoney(exec.max, card.currency));
        return actionInvalid({ amountCents: message }, message);
      }
      const result = await recordSettlement({ groupId: exec.groupId, personId: exec.personId, direction: exec.direction, amountCents: amount, note: null });
      if (!result.ok) return result;
      return done(ready, { amount: cents(amount), pending: result.data.status === "PENDING", canUndo: true }, result.data.id);
    }
    case "settlePending": {
      const decision = edits.decision ?? "confirm";
      const result = await (decision === "confirm" ? confirmSettlement : declineSettlement)({ settlementId: exec.settlementId });
      return result.ok ? done(ready, { decision }) : result;
    }
    case "updateBill": {
      const result = await updateBill(exec.input);
      return result.ok ? done(ready) : result;
    }
    case "finishClaiming": {
      const result = await finishClaiming({ billId: exec.billId });
      return result.ok ? done(ready) : result;
    }
    case "deleteBill": {
      const result = await deleteBill({ billId: exec.billId });
      return result.ok ? done(ready) : result;
    }
  }
}
