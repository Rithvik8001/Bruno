"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import { createBill } from "@/lib/bills/actions";
import { formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { newBillCopy } from "../_data";
import { toCreateInput, type FlowMode } from "../_lib/derive";
import { emptyDraft, todayIso, type BillDraft } from "../_lib/draft";
import { dayLabel } from "../_lib/format";
import { rosterOf } from "../_lib/people";
import { ClaimStep } from "./claim-step";
import { ItemsStep } from "./items-step";
import { SplitStep } from "./split-step";

type Step = "items" | "claim" | "split";

const ITEM_FIELDS = ["title", "occurredOn", "payerId", "items", "taxCents", "tip", "discountCents"] as const;

function stepForFields(fields: Readonly<Record<string, string>> | undefined): Step | null {
  if (!fields) return null;
  return Object.keys(fields).some((key) => ITEM_FIELDS.some((field) => key === field || key.startsWith(`${field}.`)))
    ? "items"
    : null;
}

export interface ManualBillFlowProps {
  composer: BillComposer;
  you: PersonId;
}

export function ManualBillFlow({ composer, you }: ManualBillFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const memberIds = useMemo(() => composer.members.map((m) => m.id), [composer.members]);
  const roster = useMemo(() => rosterOf(composer.members), [composer.members]);
  const [today] = useState(todayIso);
  const [step, setStep] = useState<Step>("items");
  const [draft, setDraft] = useState<BillDraft>(() => emptyDraft(memberIds, you, today));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const go = (next: Step) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDraft = (update: (draft: BillDraft) => BillDraft) => {
    setError(null);
    setDraft(update);
  };

  const save = (mode: FlowMode) =>
    startTransition(async () => {
      setError(null);
      const result = await createBill(toCreateInput(draft, composer.id, memberIds, mode));
      if (!result.ok) {
        const fields = result.error.fields;
        const first = fields ? Object.values(fields)[0] : undefined;
        const back = stepForFields(fields);
        if (back) go(back);
        setError(first ?? result.error.message);
        return;
      }
      toast({
        message: newBillCopy.saved(result.data.title, formatMoney(result.data.total, composer.currency)),
        icon: "check",
        tint: "green",
      });
      router.push(routes.group(result.data.groupId));
    });

  return (
    <div className="px-5 pt-5 pb-10">
      {step === "items" && (
        <ItemsStep
          draft={draft}
          onDraft={onDraft}
          onRestore={setDraft}
          composer={composer}
          you={you}
          error={error}
          onBack={() => router.push(routes.newBillFor(composer.id))}
          onNext={() => go("claim")}
        />
      )}
      {step === "claim" && (
        <ClaimStep
          draft={draft}
          onDraft={onDraft}
          composer={composer}
          roster={roster}
          memberIds={memberIds}
          you={you}
          dateLabel={dayLabel(draft.occurredOn, today, newBillCopy.today)}
          error={error}
          pending={pending}
          onBack={() => go("items")}
          onEditor={() => go("split")}
          onFinish={() => save("items")}
        />
      )}
      {step === "split" && (
        <SplitStep
          draft={draft}
          onDraft={onDraft}
          composer={composer}
          roster={roster}
          memberIds={memberIds}
          you={you}
          error={error}
          pending={pending}
          onBack={() => go("claim")}
          onSave={() => save("split")}
        />
      )}
    </div>
  );
}
