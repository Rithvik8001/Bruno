"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/actions/errors";
import { formatMoney } from "@/lib/currency";
import { inlineDay, relativeDay } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { confirmSettlement, declineSettlement, undoSettlement } from "@/lib/settlements/actions";
import { paymentMethodLabels } from "@/lib/settlements/messages";
import type { SettlementCard } from "@/lib/settlements/rows";
import { groupDetailCopy } from "../_data";

export interface PaymentsListProps {
  settlements: readonly SettlementCard[];
  you: PersonId;
}

export function PaymentsList({ settlements, you }: PaymentsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const copy = groupDetailCopy.paymentList;
  const now = new Date();
  const nameOf = (p: PersonView) => (p.id === you ? groupDetailCopy.youName : firstNameOf(p.displayName));

  const run = (task: () => Promise<ActionResult<unknown>>, message: string) =>
    startTransition(async () => {
      const result = await task();
      toast(
        result.ok
          ? { message, icon: "check", tint: "green" }
          : { message: result.error.message, icon: "alert", tint: "red" },
      );
      router.refresh();
    });

  return (
    <section className="grid gap-2">
      <h2 className="m-0 text-body font-semibold">{copy.title}</h2>
      <ul aria-label={copy.label} className="m-0 grid list-none p-0 [&>li+li]:border-t [&>li+li]:border-line">
        {settlements.map((s) => {
          const status =
            s.status === "CONFIRMED" || s.counts
              ? { label: copy.status.confirmed, tint: "green" as const }
              : s.autoConfirmAt
                ? { label: copy.status.auto(inlineDay(s.autoConfirmAt, now)), tint: "blue" as const }
                : { label: copy.status.pending, tint: "blue" as const };
          return (
            <li key={s.id} className="grid gap-2 py-3">
              <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
                <Avatar name={s.from.displayName} tint={s.from.tint} buddy={s.from.buddy} size="xl" />
                <span className="grid min-w-0">
                  <span className="truncate font-medium">
                    {copy.line(nameOf(s.from), nameOf(s.to), formatMoney(s.amount, s.currency))}
                  </span>
                  <span className="truncate text-small text-text-2">
                    {copy.caption(paymentMethodLabels[s.method], relativeDay(s.createdAt, now))}
                    {s.note ? ` · ${s.note}` : ""}
                  </span>
                </span>
                <Chip tint={status.tint} size="sm" dot>
                  {status.label}
                </Chip>
              </div>
              {(s.actions.confirm || s.actions.decline || s.actions.undo) && (
                <div className="flex flex-wrap gap-2 pl-[54px]">
                  {s.actions.confirm && (
                    <Button size="sm" disabled={pending} onClick={() => run(() => confirmSettlement({ settlementId: s.id }), copy.confirmed)}>
                      {copy.confirm}
                    </Button>
                  )}
                  {s.actions.decline && (
                    <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => declineSettlement({ settlementId: s.id }), copy.declined)}>
                      {copy.decline}
                    </Button>
                  )}
                  {s.actions.undo && (
                    <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => undoSettlement({ settlementId: s.id }), copy.undone)}>
                      {copy.undo}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
