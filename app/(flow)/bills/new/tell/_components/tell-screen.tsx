"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { Icon } from "@/components/icons/icon";
import { StepSwap } from "@/components/motion/rise";
import { BackLink } from "@/components/patterns/back-link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer, GroupSummary } from "@/lib/groups/queries";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { useTimeline } from "@/lib/hooks/use-timeline";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { firstNameOf } from "@/lib/people/defaults";
import { scanQuota } from "@/lib/scans/actions";
import type { ScanQuota } from "@/lib/scans/quota";
import { answerTell, discardTell, draftBill } from "@/lib/tell/actions";
import { TELL_RETRY_GAP_MS, TELL_TEXT_MAX } from "@/lib/tell/rules";
import { GroupChips } from "../../_components/group-chips";
import { QuotaChip } from "../../_components/quota-chip";
import { browserTimeZone } from "../../_lib/upload";
import { tellCopy } from "../_data";
import { EMPTY_CLARIFY, toAnswers, type ClarifyState } from "../_lib/clarify";
import { REVEAL_HOLD_MS, TELL_CREEP, TELL_REVEAL, type TellFailureKind, type TellPhase } from "../_lib/phase";
import { ClarifyStep } from "./clarify-step";
import { ExamplePrompts } from "./example-prompts";
import { KnownMembers } from "./known-members";
import { TellFailedCard } from "./tell-failed-card";
import { TellField } from "./tell-field";
import { TellWorking } from "./tell-working";

const TOAST_MS = 6000;
const KEYBOARD_SETTLE_MS = 300;
const RETRY_GAP_SECONDS = TELL_RETRY_GAP_MS / 1000;

export interface TellScreenProps {
  composer: BillComposer;
  groups: readonly GroupSummary[];
  you: PersonId;
  quota: ScanQuota;
  initialText: string;
}

export function TellScreen({ composer, groups, you, quota: initialQuota, initialText }: TellScreenProps) {
  const copy = tellCopy;
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [phase, setPhase] = useState<TellPhase>({ kind: "compose", failure: null });
  const [quota, setQuota] = useState(initialQuota);
  const [focused, setFocused] = useState(false);
  const [clarify, setClarify] = useState<ClarifyState>(EMPTY_CLARIFY);
  const [navigating, startNavigation] = useTransition();
  const creep = useTimeline(TELL_CREEP);
  const reveal = useTimeline(TELL_REVEAL);
  const cooldown = useCooldown(RETRY_GAP_SECONDS, false);
  const cancelledRef = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const speech = useSpeechRecognition(
    useCallback((transcript: string) => {
      setText((current) => [current.trim(), transcript].filter(Boolean).join(" "));
    }, []),
  );
  const listening = speech.status === "listening";

  const others = composer.members.filter((m) => m.id !== you).map((m) => firstNameOf(m.displayName));
  const examples = copy.compose.examples(others[0] ?? null, others[1] ?? null);
  const empty = text.trim() === "";
  const over = text.length > TELL_TEXT_MAX;
  const canDraft = !empty && !over && !listening && !cooldown.active;
  const failure = phase.kind === "compose" ? phase.failure : null;

  const refreshQuota = useCallback(async () => {
    const result = await scanQuota({ timeZone: browserTimeZone() });
    if (result.ok) setQuota(result.data);
  }, []);

  const toCompose = (next: TellFailureKind | null) => {
    creep.reset();
    reveal.reset();
    setPhase({ kind: "compose", failure: next });
  };

  const draft = async () => {
    if (!canDraft) return;
    cancelledRef.current = false;
    setClarify(EMPTY_CLARIFY);
    setPhase({ kind: "working" });
    window.scrollTo({ top: 0 });
    creep.start();
    const result = await draftBill({ groupId: composer.id, text, timeZone: browserTimeZone() }).catch(() => null);
    if (cancelledRef.current) {
      if (result?.ok) await discardTell({ draftId: result.data.draftId });
      void refreshQuota();
      return;
    }
    if (result === null) {
      buzz(HAPTICS.error);
      cooldown.restart();
      toCompose("network");
      return;
    }
    if (!result.ok) {
      buzz(HAPTICS.error);
      await refreshQuota();
      if (result.error.code === "invalid" && !result.error.fields) {
        toCompose("vague");
        return;
      }
      if (result.error.code === "unknown") {
        cooldown.restart();
        toCompose("network");
        return;
      }
      if (result.error.code === "rateLimited") cooldown.restart(result.error.retryAfter ?? RETRY_GAP_SECONDS);
      toast({ message: result.error.fields?.text ?? result.error.message, duration: TOAST_MS });
      toCompose(null);
      return;
    }
    setQuota((current) => ({ ...current, used: current.used + 1, left: Math.max(0, current.left - 1) }));
    setPhase({ kind: "revealing", drafted: result.data });
    reveal.start();
  };

  const toReview = useCallback(
    (draftId: string) =>
      startNavigation(() => {
        router.push(routes.tellReview(draftId));
      }),
    [router],
  );

  useEffect(() => {
    if (phase.kind !== "revealing" || reveal.running || reveal.progress === null) return;
    const drafted = phase.drafted;
    const timer = setTimeout(() => {
      if (drafted.result.questions.length > 0) {
        setPhase({ kind: "clarify", drafted });
        window.scrollTo({ top: 0 });
      } else toReview(drafted.draftId);
    }, REVEAL_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, reveal.running, reveal.progress, toReview]);

  const cancel = () => {
    cancelledRef.current = true;
    toCompose(null);
  };

  const submitAnswers = (draftId: string) =>
    startNavigation(async () => {
      const saved = await answerTell({ draftId, answers: toAnswers(clarify) });
      if (!saved.ok) {
        toast({ message: saved.error.message, duration: TOAST_MS });
        toCompose(null);
        return;
      }
      router.push(routes.tellReview(draftId));
    });

  const onFocusChange = (value: boolean) => {
    setFocused(value);
    if (!value || !window.matchMedia("(pointer: coarse)").matches) return;
    setTimeout(() => anchorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), KEYBOARD_SETTLE_MS);
  };

  const composing = phase.kind === "compose";
  const showExamples = composing && empty && !listening && failure === null && !focused;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-5 pt-5 pb-10">
      <div className="flex min-w-0 items-center justify-between gap-3">
        {composing ? (
          <BackLink href={routes.newBillFor(composer.id)} label={copy.back} className="shrink-0" />
        ) : (
          <BackLink label={copy.backToCompose} onClick={cancel} />
        )}
        <PopIn popKey={quota.left} className="min-w-0">
          <QuotaChip quota={quota} />
        </PopIn>
      </div>

      <StepSwap stepKey={phase.kind === "revealing" ? "working" : phase.kind} className="grid grid-cols-[minmax(0,1fr)] gap-5">
        {phase.kind === "compose" && (
          <>
            <div className="grid gap-1.5">
              <h1 className="m-0 text-heading">{copy.compose.title}</h1>
              <p className="m-0 text-pretty text-text-2">{copy.compose.body}</p>
            </div>
            <div ref={anchorRef} className="grid scroll-mt-3 gap-2.5">
              <GroupChips groups={groups} selectedId={composer.id} hrefFor={(id) => routes.tellBill(id)} />
              <KnownMembers composer={composer} you={you} />
            </div>
            <div className="grid gap-3">
              <TellField
                text={text}
                placeholder={copy.compose.placeholder(others[0] ?? null)}
                speech={speech}
                onText={(value) => {
                  setText(value);
                  if (failure !== null) setPhase({ kind: "compose", failure: null });
                }}
                onFocusChange={onFocusChange}
                onMic={() => {
                  if (failure !== null) setPhase({ kind: "compose", failure: null });
                  speech.start();
                }}
              />
              {failure !== null ? (
                <TellFailedCard
                  failure={failure}
                  example={examples[0] ?? ""}
                  manualHref={routes.manualBill(composer.id)}
                  canRetry={canDraft}
                  retryIn={cooldown.remaining}
                  onRetry={() => void draft()}
                />
              ) : (
                <div className="grid gap-2">
                  <Button size="lg" fullWidth disabled={!canDraft} onClick={() => void draft()} className="h-13 text-[16px]">
                    <Icon name="sparkle" size={16} />
                    {cooldown.active ? copy.compose.wait(cooldown.remaining) : copy.compose.cta}
                  </Button>
                  <span className="text-center text-footnote text-muted">{copy.compose.ctaNote}</span>
                </div>
              )}
            </div>
            {showExamples && <ExamplePrompts examples={examples} onPick={setText} />}
          </>
        )}
        {(phase.kind === "working" || phase.kind === "revealing") && (
          <TellWorking
            text={text}
            group={composer.name}
            currency={composer.currency}
            members={composer.members}
            creep={creep.progress}
            reveal={reveal.progress}
            result={phase.kind === "revealing" ? phase.drafted.result : null}
            onCancel={phase.kind === "working" ? cancel : null}
          />
        )}
        {phase.kind === "clarify" && (
          <ClarifyStep
            text={text}
            result={phase.drafted.result}
            composer={composer}
            you={you}
            state={clarify}
            pending={navigating}
            onState={setClarify}
            onSubmit={() => submitAnswers(phase.drafted.draftId)}
            onSkip={() => toReview(phase.drafted.draftId)}
          />
        )}
      </StepSwap>
    </div>
  );
}
