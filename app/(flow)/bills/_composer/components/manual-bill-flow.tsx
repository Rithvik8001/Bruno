"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { StepSwap } from "@/components/motion/rise";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import { createBill, updateBill } from "@/lib/bills/actions";
import { startClaiming } from "@/lib/claiming/actions";
import type { ActionResult } from "@/lib/actions/errors";
import { formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { claimingEditCopy, composerCopy, flowModeCopy } from "../data";
import { draftTotals, toBillValues, toCreateInput, type FlowMode } from "../lib/derive";
import { emptyDraft, todayIso, type BillDraft } from "../lib/draft";
import { dayLabel } from "../lib/format";
import { rosterOf } from "../lib/people";
import type { ComposerMode, FlowStep } from "../lib/steps";
import { ClaimStep } from "./claim-step";
import { ItemsStep } from "./items-step";
import { SplitStep } from "./split-step";

const ITEM_FIELDS = ["title", "occurredOn", "payerId", "items", "taxCents", "tip", "discountCents"] as const;

function stepForFields(fields: Readonly<Record<string, string>> | undefined): FlowStep | null {
  if (!fields) return null;
  return Object.keys(fields).some((key) => ITEM_FIELDS.some((field) => key === field || key.startsWith(`${field}.`)))
    ? "items"
    : null;
}

export interface ManualBillFlowProps {
  composer: BillComposer;
  you: PersonId;
  mode: ComposerMode;
  initialDraft?: BillDraft;
  initialStep?: FlowStep;
}

interface Saved {
  readonly href: string;
  readonly title: string;
}

export function ManualBillFlow({ composer, you, mode, initialDraft, initialStep = "items" }: ManualBillFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const memberIds = useMemo(() => composer.members.map((m) => m.id), [composer.members]);
  const roster = useMemo(() => rosterOf(composer.members), [composer.members]);
  const [today] = useState(todayIso);
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [draft, setDraft] = useState<BillDraft>(() => initialDraft ?? emptyDraft(memberIds, you, today));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const modeCopy = flowModeCopy[mode.kind];
  const claimCode = mode.kind === "edit" ? mode.claimCode : null;
  const claimHref = claimCode ? routes.claimBill(claimCode) : null;
  const exitHref = claimHref ?? (mode.kind === "edit" ? routes.bill(mode.slug) : routes.newBillFor(composer.id));

  const go = (next: FlowStep) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDraft = (update: (draft: BillDraft) => BillDraft) => {
    setError(null);
    setDraft(update);
  };

  const submit = async (flow: FlowMode): Promise<ActionResult<Saved>> => {
    if (mode.kind === "edit") {
      const result = await updateBill({ ...toBillValues(draft, memberIds, flow), billId: mode.billId });
      return result.ok ? { ok: true, data: { href: routes.bill(result.data.slug), title: result.data.title } } : result;
    }
    const result = await createBill(toCreateInput(draft, composer.id, memberIds, flow));
    return result.ok ? { ok: true, data: { href: routes.group(result.data.groupId), title: result.data.title } } : result;
  };

  const saveItems = () =>
    startTransition(async () => {
      if (mode.kind !== "edit" || !claimHref) return;
      setError(null);
      const result = await updateBill({ ...toBillValues(draft, memberIds, "items"), billId: mode.billId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      toast({ message: claimingEditCopy.saved(result.data.title) });
      router.push(claimHref);
    });

  const goLive = () =>
    startTransition(async () => {
      setError(null);
      const result = await startClaiming(toCreateInput(draft, composer.id, memberIds, "items"));
      if (!result.ok) {
        const back = stepForFields(result.error.fields);
        if (back) go(back);
        setError(result.error.message);
        return;
      }
      toast({ message: claimingEditCopy.live(result.data.title) });
      router.push(routes.claimBill(result.data.code));
    });

  const save = (flow: FlowMode) =>
    startTransition(async () => {
      setError(null);
      const result = await submit(flow);
      if (!result.ok) {
        const fields = result.error.fields;
        const first = fields ? Object.values(fields)[0] : undefined;
        const back = stepForFields(fields);
        if (back) go(back);
        setError(first ?? result.error.message);
        return;
      }
      const total = draftTotals(draft)?.total;
      toast({
        message: modeCopy.saved(result.data.title, total === undefined ? "" : formatMoney(total, composer.currency)),
      });
      router.push(result.data.href);
    });

  return (
    <StepSwap stepKey={step} className="px-5 pt-5 pb-10">
      {step === "items" && (
        <ItemsStep
          draft={draft}
          onDraft={onDraft}
          onRestore={setDraft}
          composer={composer}
          you={you}
          error={error}
          modeCopy={claimHref ? claimingEditCopy : modeCopy}
          cta={claimHref ? composerCopy.items.claimingCta : composerCopy.items.cta}
          pending={pending}
          onBack={() => router.push(exitHref)}
          onNext={claimHref ? saveItems : () => go("claim")}
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
          dateLabel={dayLabel(draft.occurredOn, today, composerCopy.today)}
          error={error}
          pending={pending}
          cta={modeCopy.finish}
          onBack={() => go("items")}
          onEditor={() => go("split")}
          onLive={mode.kind === "create" ? goLive : null}
          livePending={pending}
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
          cta={modeCopy.save}
          onBack={() => (claimHref ? router.push(claimHref) : go("claim"))}
          onSave={() => save("split")}
        />
      )}
    </StepSwap>
  );
}
