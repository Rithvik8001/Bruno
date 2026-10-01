"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { Icon } from "@/components/icons/icon";
import { AllowanceChip } from "@/components/patterns/allowance-chip";
import { BackLink } from "@/components/patterns/back-link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AI_RETRY_GAP_MS } from "@/lib/ai/rules";
import type { AskActResult } from "@/lib/ask/actions/card";
import { ACTION_WORKING_MIN_MS, type AskDecision } from "@/lib/ask/actions/kinds";
import { cancelAskAction, confirmAskAction, proposeAskAction, undoAskAction } from "@/lib/ask/actions/server";
import type { AskStartView } from "@/lib/ask/queries";
import type { AskPick } from "@/lib/ask/result";
import { ASK_TEXT_MAX } from "@/lib/ask/rules";
import { routes } from "@/lib/auth/rules";
import { browserTimeZone } from "@/lib/browser-time-zone";
import type { PersonId } from "@/lib/domain/ids";
import { useAllowance } from "@/lib/hooks/use-allowance";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { askCopy } from "../_data";
import { captionFor } from "../_lib/captions";
import { clarifyView } from "../_lib/clarify";
import { askStream } from "../_lib/stream";
import { actionView, deniedView, doneView, noteView, type ActionContext } from "../_lib/action-view";
import { actionSuggestionsFor, suggestionsFor } from "../_lib/suggest";
import { EMPTY_THREAD, isBusy, threadReducer, type ActionEntry, type AskEntry, type DoneEntry } from "../_lib/thread";
import { cardView, type ActView, type ViewContext } from "../_lib/view";
import { ActionCard } from "./action-card";
import { ActionDone, ActionLine } from "./action-done";
import { AnswerCard } from "./answer-card";
import { AskErrorCard } from "./ask-error-card";
import { AskField } from "./ask-field";
import { AskLimitCard } from "./ask-limit-card";
import { ClarifyCard } from "./clarify-card";
import { FoldedAnswer, foldedAnswer } from "./folded-answer";
import { NoteCard } from "./note-card";
import { ScopeChips } from "./scope-chips";
import { ActionSuggestions, Suggestions } from "./suggestions";
import { ThinkingCard } from "./thinking-card";

const TOAST_MS = 6000;
const KEYBOARD_SETTLE_MS = 300;
const SCROLL_SETTLE_MS = 60;
const RETRY_GAP_SECONDS = AI_RETRY_GAP_MS / 1000;

export interface AskScreenProps {
  start: AskStartView;
  you: { readonly id: PersonId; readonly displayName: string };
  autoListen: boolean;
}

interface Clarifies {
  readonly questionId: string;
  readonly picks: readonly AskPick[];
}

export function AskScreen({ start, you, autoListen }: AskScreenProps) {
  const copy = askCopy;
  const { toast } = useToast();
  const [thread, dispatch] = useReducer(threadReducer, EMPTY_THREAD);
  const [text, setText] = useState("");
  const { quota, setQuota, refresh: refreshQuota } = useAllowance(start.quota);
  const [failure, setFailure] = useState<{ readonly message: string | null } | null>(null);
  const [focused, setFocused] = useState(false);
  const [now] = useState(() => new Date());
  const cooldown = useCooldown(RETRY_GAP_SECONDS, false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const threadIdRef = useRef<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listenedRef = useRef(false);

  const speech = useSpeechRecognition(
    useCallback((transcript: string) => {
      setText((current) => [current.trim(), transcript].filter(Boolean).join(" "));
    }, []),
  );
  const listening = speech.status === "listening";
  const { supported, start: startListening } = speech;

  useEffect(() => {
    if (!autoListen || listenedRef.current || !supported || start.quota.left <= 0) return;
    listenedRef.current = true;
    startListening();
  }, [autoListen, supported, startListening, start.quota.left]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const scope = start.scope;
  const busy = isBusy(thread);
  const locked = quota.left <= 0;
  const hasThread = thread.entries.length > 0;
  const empty = text.trim() === "";
  const over = text.length > ASK_TEXT_MAX;
  const canAsk = !empty && !over && !listening && !busy && !locked && !cooldown.active;
  const suggestions = useMemo(() => suggestionsFor(start.seeds, scope !== null), [start.seeds, scope]);
  const actionSuggestions = useMemo(() => actionSuggestionsFor(start.seeds), [start.seeds]);
  const actionContext: ActionContext = useMemo(() => ({ you: you.id, now }), [you.id, now]);
  const viewContext: ViewContext = useMemo(() => ({ you: you.id, now, examples: suggestions.map((suggestion) => suggestion.text) }), [you.id, now, suggestions]);
  const backHref = scope ? routes.group(scope.id) : routes.app;

  const count = thread.entries.length;
  useEffect(() => {
    if (count === 0) return;
    const timer = setTimeout(() => {
      const entries = document.querySelectorAll("[data-ask-entry]");
      entries[entries.length - 1]?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, SCROLL_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [count]);

  const run = async (id: number, question: string, clarifies: Clarifies | null) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const result = await askStream(
      {
        text: question,
        timeZone: browserTimeZone(),
        groupId: scope?.id ?? null,
        threadId: threadIdRef.current,
        clarifies: clarifies ? { questionId: clarifies.questionId, picks: [...clarifies.picks] } : null,
      },
      controller.signal,
      (step) => dispatch({ type: "step", id, step }),
    );
    if (result.kind === "aborted") return;
    if (result.kind === "done") {
      const { reply, threadId, questionId } = result.done;
      threadIdRef.current = threadId;
      setQuota(result.done.quota);
      if (reply.kind === "clarify") {
        dispatch({ type: "clarify", id, questionId, questions: reply.questions, threadId });
        return;
      }
      buzz(HAPTICS.press);
      if (reply.kind === "action") dispatch({ type: "propose", id, action: reply.action, threadId });
      else if (reply.kind === "denied") dispatch({ type: "denied", id, denied: reply.denied, threadId });
      else if (reply.kind === "note") dispatch({ type: "note", id, note: reply.note, threadId });
      else dispatch({ type: "answer", id, card: reply.card, threadId });
      return;
    }
    buzz(HAPTICS.error);
    dispatch({ type: "drop", id });
    setText(question);
    if (result.kind === "failed") {
      if (result.quota) setQuota(result.quota);
      cooldown.restart();
      setFailure({ message: result.message });
      return;
    }
    const { error } = result;
    if (error.code === "rateLimited") cooldown.restart(error.retryAfter ?? RETRY_GAP_SECONDS);
    if (error.code === "conflict") await refreshQuota();
    toast({ message: error.fields?.text ?? error.message, duration: TOAST_MS });
  };

  const ask = (value: string) => {
    const question = value.trim();
    if (question === "" || question.length > ASK_TEXT_MAX || busy || locked || cooldown.active) return;
    const id = nextId.current++;
    dispatch({ type: "ask", id, question, resolved: null });
    setText("");
    setFailure(null);
    void run(id, question, null);
  };

  const cancel = (entry: AskEntry) => {
    abortRef.current?.abort();
    dispatch({ type: "drop", id: entry.id });
    setText(entry.question);
  };

  const pick = (entry: Extract<AskEntry, { kind: "clarify" }>, picks: readonly AskPick[], labels: readonly string[]) => {
    const allPicks = [...entry.picks, ...picks];
    const allLabels = [...entry.labels, ...labels];
    if (allPicks.length < entry.questions.length) {
      picks.forEach((value, index) => dispatch({ type: "pick", id: entry.id, pick: value, label: labels[index] ?? "" }));
      return;
    }
    dispatch({ type: "think", id: entry.id, resolved: allLabels.filter(Boolean).join(" · ") });
    void run(entry.id, entry.question, { questionId: entry.questionId, picks: allPicks });
  };

  const skip = (entry: Extract<AskEntry, { kind: "clarify" }>) => {
    const rest = entry.questions.slice(entry.picks.length).flatMap((question) => {
      const [likeliest] = clarifyView(question).options;
      return likeliest ? [likeliest] : [];
    });
    pick(
      entry,
      rest.map((option) => option.pick),
      rest.map((option) => option.label),
    );
  };

  const act = async (view: ActView) => {
    if (busy || cooldown.active) return;
    const id = nextId.current++;
    dispatch({ type: "ask", id, question: view.label, resolved: null });
    setFailure(null);
    const result = await proposeAskAction({ ...view.intent, threadId: threadIdRef.current, timeZone: browserTimeZone() }).catch(() => null);
    if (!result?.ok) {
      buzz(HAPTICS.error);
      dispatch({ type: "drop", id });
      if (result?.error.code === "rateLimited") cooldown.restart(result.error.retryAfter ?? RETRY_GAP_SECONDS);
      toast({ message: result?.error.message ?? copy.act.alert.failed.title, duration: TOAST_MS });
      return;
    }
    buzz(HAPTICS.press);
    const reply = result.data;
    if (reply.kind === "action") dispatch({ type: "propose", id, action: reply.action, threadId: null });
    else if (reply.kind === "denied") dispatch({ type: "denied", id, denied: reply.denied, threadId: null });
    else dispatch({ type: "note", id, note: reply.note, threadId: null });
  };

  const settle = (entry: ActionEntry, result: AskActResult) => {
    setQuota(result.quota);
    if (result.state === "done") {
      buzz(HAPTICS.celebrate);
      dispatch({ type: "finish", id: entry.id, outcome: result.outcome });
    } else if (result.state === "stale") {
      dispatch({ type: "edit", id: entry.id, patch: { state: "stale", fresh: result.action, declining: false } });
    } else if (result.state === "limit") {
      dispatch({ type: "edit", id: entry.id, patch: { state: "limit", declining: false } });
    } else if (result.gone.kind === "note") {
      dispatch({ type: "note", id: entry.id, note: result.gone.note, threadId: null });
    } else {
      dispatch({ type: "denied", id: entry.id, denied: result.gone.denied, threadId: null });
    }
  };

  const confirm = async (entry: ActionEntry, decision: AskDecision | null) => {
    if (entry.state === "working") return;
    dispatch({ type: "edit", id: entry.id, patch: { state: "working", declining: decision === "decline", error: null } });
    const started = Date.now();
    const result = await confirmAskAction({
      actionId: entry.actionId,
      timeZone: browserTimeZone(),
      edits: { amount: entry.card.kind === "recordPayment" ? entry.amount : null, skip: [...entry.skip], decision },
    }).catch(() => null);
    const wait = ACTION_WORKING_MIN_MS - (Date.now() - started);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    if (result?.ok) {
      settle(entry, result.data);
      return;
    }
    buzz(HAPTICS.error);
    dispatch({ type: "edit", id: entry.id, patch: { state: "failed", declining: false, error: result?.error.fields?.amountCents ?? result?.error.message ?? null } });
  };

  const notNow = (entry: AskEntry, actionId: string | null) => {
    dispatch({ type: "line", id: entry.id, head: copy.act.line.notNow, body: copy.act.line.unchanged, free: true });
    if (actionId) void cancelAskAction({ actionId, timeZone: browserTimeZone() }).catch(() => undefined);
  };

  const undo = async (entry: DoneEntry) => {
    const undone = doneView(entry.card, entry.outcome, actionContext).undone;
    if (entry.undoing || undone === null) return;
    dispatch({ type: "undoing", id: entry.id, undoing: true });
    const result = await undoAskAction({ actionId: entry.actionId, timeZone: browserTimeZone() }).catch(() => null);
    if (!result?.ok) {
      buzz(HAPTICS.error);
      dispatch({ type: "undoing", id: entry.id, undoing: false });
      toast({ message: result?.error.message ?? copy.act.alert.failed.title, duration: TOAST_MS });
      return;
    }
    setQuota(result.data.quota);
    dispatch({ type: "line", id: entry.id, head: copy.act.line.undone, body: undone, free: false });
  };

  const toggleSkip = (entry: ActionEntry, key: string) => {
    dispatch({ type: "edit", id: entry.id, patch: { skip: entry.skip.includes(key) ? entry.skip.filter((item) => item !== key) : [...entry.skip, key] } });
  };

  const newQuestion = () => {
    abortRef.current?.abort();
    threadIdRef.current = null;
    dispatch({ type: "reset" });
    setText("");
    setFailure(null);
    window.scrollTo({ top: 0 });
  };

  const onFocusChange = (value: boolean) => {
    setFocused(value);
    if (!value || !window.matchMedia("(pointer: coarse)").matches) return;
    setTimeout(() => anchorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), KEYBOARD_SETTLE_MS);
  };

  const showSuggestions = !hasThread && empty && !listening && failure === null && !focused && !locked && suggestions.length > 0;
  const lastIndex = thread.entries.length - 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-5 pt-5 pb-12">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <BackLink href={backHref} label={scope ? copy.back.group(scope.name) : copy.back.home} className="shrink" />
        <PopIn popKey={quota.left} className="min-w-0 shrink-0">
          <AllowanceChip quota={quota} look="sparkle" />
        </PopIn>
      </div>

      {!hasThread && (
        <div className="grid gap-1.5">
          <h1 className="m-0 text-heading">{copy.title}</h1>
          <p className="m-0 text-pretty text-text-2">{copy.body}</p>
        </div>
      )}

      <ScopeChips groups={start.groups} selectedId={scope?.id ?? null} />

      {thread.entries.map((entry, index) => {
        const last = index === lastIndex;
        const resolved = entry.kind === "clarify" ? null : entry.resolved;
        return (
          <section key={entry.id} data-ask-entry className="grid scroll-mt-3 grid-cols-[minmax(0,1fr)] gap-2.5">
            <div className="flex flex-wrap items-center gap-2 px-0.5">
              <h2 className="m-0 min-w-0 text-lead font-semibold tracking-[-0.01em] text-pretty wrap-anywhere">{entry.question}</h2>
              {resolved && (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-brand-tint pr-2 pl-1.5 text-caption whitespace-nowrap text-brand">
                  <Icon name="check" size={12} strokeWidth={2.6} />
                  {resolved}
                </span>
              )}
            </div>
            {entry.kind === "thinking" && <ThinkingCard caption={captionFor(entry.steps, you.displayName)} onCancel={() => cancel(entry)} />}
            {entry.kind === "clarify" && (
              <ClarifyCard questions={entry.questions} answered={entry.picks.length} onPick={(value, label) => pick(entry, [value], [label])} onSkip={() => skip(entry)} />
            )}
            {entry.kind === "answer" &&
              (last || thread.open[entry.id] ? (
                <AnswerCard
                  view={cardView(entry.card, viewContext)}
                  foldable={!last}
                  showFollow={last}
                  followDisabled={locked || busy || cooldown.active}
                  onFold={() => dispatch({ type: "toggle", id: entry.id })}
                  onAsk={ask}
                  onAct={(view) => void act(view)}
                />
              ) : (
                <FoldedAnswer view={foldedAnswer(cardView(entry.card, viewContext))} onOpen={() => dispatch({ type: "toggle", id: entry.id })} />
              ))}
            {entry.kind === "action" && (
              <ActionCard
                view={actionView(entry.card, { amount: entry.amount, skip: entry.skip }, actionContext)}
                state={entry.state}
                declining={entry.declining}
                error={entry.error}
                quota={quota}
                denied={null}
                onToggle={(key) => toggleSkip(entry, key)}
                onAmount={(amount) => dispatch({ type: "edit", id: entry.id, patch: { amount } })}
                onConfirm={(decision) => void confirm(entry, decision)}
                onCancel={() => notNow(entry, entry.actionId)}
                onRefresh={() => dispatch({ type: "renew", id: entry.id })}
              />
            )}
            {entry.kind === "done" &&
              (() => {
                const view = doneView(entry.card, entry.outcome, actionContext);
                return last || thread.open[entry.id] ? (
                  <ActionDone
                    view={view}
                    quota={quota}
                    canUndo={entry.outcome.canUndo}
                    undoing={entry.undoing}
                    foldable={!last}
                    onUndo={() => void undo(entry)}
                    onFold={() => dispatch({ type: "toggle", id: entry.id })}
                  />
                ) : (
                  <FoldedAnswer view={{ eyebrow: view.eyebrow, text: view.folded, tone: "plain", ticked: !view.declined }} onOpen={() => dispatch({ type: "toggle", id: entry.id })} />
                );
              })()}
            {entry.kind === "denied" &&
              (() => {
                const denied = deniedView(entry.denied, actionContext);
                return (
                  <ActionCard
                    view={denied.view}
                    state="denied"
                    declining={false}
                    error={null}
                    quota={quota}
                    denied={denied}
                    onToggle={() => undefined}
                    onAmount={() => undefined}
                    onConfirm={() => undefined}
                    onCancel={() => undefined}
                    onRefresh={() => undefined}
                  />
                );
              })()}
            {entry.kind === "note" && <NoteCard view={noteView(entry.note)} onDismiss={() => notNow(entry, null)} />}
            {entry.kind === "line" && <ActionLine head={entry.head} body={entry.body} free={entry.free} />}
          </section>
        );
      })}

      <div ref={anchorRef} className="grid scroll-mt-3 grid-cols-[minmax(0,1fr)] gap-3">
        {failure !== null && !busy && <AskErrorCard message={failure.message} canRetry={canAsk} retryIn={cooldown.remaining} onRetry={() => ask(text)} />}
        {locked ? (
          !busy && <AskLimitCard quota={quota} backHref={backHref} backLabel={scope ? copy.limit.backGroup(scope.name) : copy.limit.backHome} />
        ) : (
          !busy && (
            <>
              <AskField
                text={text}
                placeholder={hasThread ? copy.field.placeholderFollow : scope ? copy.field.placeholderGroup(scope.name) : copy.field.placeholder(suggestions[0]?.text ?? copy.suggest.everyone)}
                compact={hasThread}
                speech={speech}
                canAsk={canAsk}
                waitSeconds={cooldown.remaining}
                onText={(value) => {
                  setText(value);
                  if (failure !== null && value.trim() === "") setFailure(null);
                }}
                onFocusChange={onFocusChange}
                onMic={() => {
                  setFailure(null);
                  speech.start();
                }}
                onAsk={() => ask(text)}
              />
              {hasThread && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="md" onClick={newQuestion} className="h-11 gap-1.5 pr-3.5 pl-2.5 text-small font-semibold">
                    <Icon name="plus" size={16} strokeWidth={2.2} />
                    {copy.thread.newQuestion}
                  </Button>
                  <span className="min-w-40 flex-1 text-footnote text-muted">{copy.thread.notSaved}</span>
                </div>
              )}
            </>
          )
        )}
      </div>

      {showSuggestions && <Suggestions label={scope ? copy.suggest.labelGroup(scope.name) : copy.suggest.label} suggestions={suggestions} onPick={ask} />}
      {showSuggestions && actionSuggestions.length > 0 && <ActionSuggestions suggestions={actionSuggestions} onPick={ask} />}
    </div>
  );
}
