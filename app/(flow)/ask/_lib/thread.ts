import type { AskActionCard, AskActionOutcome, AskActionView, AskDenied, AskNote } from "@/lib/ask/actions/card";
import type { AskCard, AskClarifyQuestion, AskPick, AskStep } from "@/lib/ask/result";
import type { Cents } from "@/lib/money";

export type ActionState = "ready" | "working" | "failed" | "stale" | "limit";

interface EntryBase {
  readonly id: number;
  readonly question: string;
}

export interface ActionEntry extends EntryBase {
  readonly kind: "action";
  readonly resolved: string | null;
  readonly actionId: string;
  readonly card: AskActionCard;
  readonly state: ActionState;
  readonly declining: boolean;
  readonly error: string | null;
  readonly fresh: AskActionView | null;
  readonly amount: Cents | null;
  readonly skip: readonly string[];
}

export interface DoneEntry extends EntryBase {
  readonly kind: "done";
  readonly resolved: string | null;
  readonly actionId: string;
  readonly card: AskActionCard;
  readonly outcome: AskActionOutcome;
  readonly undoing: boolean;
}

export type AskEntry =
  | (EntryBase & { readonly kind: "thinking"; readonly steps: readonly AskStep[]; readonly resolved: string | null })
  | (EntryBase & {
      readonly kind: "clarify";
      readonly questionId: string;
      readonly questions: readonly AskClarifyQuestion[];
      readonly picks: readonly AskPick[];
      readonly labels: readonly string[];
    })
  | (EntryBase & { readonly kind: "answer"; readonly card: AskCard; readonly resolved: string | null })
  | ActionEntry
  | DoneEntry
  | (EntryBase & { readonly kind: "denied"; readonly denied: AskDenied; readonly resolved: string | null })
  | (EntryBase & { readonly kind: "note"; readonly note: AskNote; readonly resolved: string | null })
  | (EntryBase & { readonly kind: "line"; readonly head: string; readonly body: string; readonly free: boolean; readonly resolved: string | null });

export interface AskThread {
  readonly entries: readonly AskEntry[];
  readonly open: Readonly<Record<number, boolean>>;
  readonly threadId: string | null;
}

export const EMPTY_THREAD: AskThread = { entries: [], open: {}, threadId: null };

export type ThreadAction =
  | { readonly type: "ask"; readonly id: number; readonly question: string; readonly resolved: string | null }
  | { readonly type: "step"; readonly id: number; readonly step: AskStep }
  | { readonly type: "clarify"; readonly id: number; readonly questionId: string; readonly questions: readonly AskClarifyQuestion[]; readonly threadId: string }
  | { readonly type: "pick"; readonly id: number; readonly pick: AskPick; readonly label: string }
  | { readonly type: "think"; readonly id: number; readonly resolved: string }
  | { readonly type: "answer"; readonly id: number; readonly card: AskCard; readonly threadId: string }
  | { readonly type: "propose"; readonly id: number; readonly action: AskActionView; readonly threadId: string | null }
  | { readonly type: "denied"; readonly id: number; readonly denied: AskDenied; readonly threadId: string | null }
  | { readonly type: "note"; readonly id: number; readonly note: AskNote; readonly threadId: string | null }
  | { readonly type: "edit"; readonly id: number; readonly patch: Partial<Pick<ActionEntry, "state" | "declining" | "error" | "fresh" | "amount" | "skip">> }
  | { readonly type: "renew"; readonly id: number }
  | { readonly type: "finish"; readonly id: number; readonly outcome: AskActionOutcome }
  | { readonly type: "undoing"; readonly id: number; readonly undoing: boolean }
  | { readonly type: "line"; readonly id: number; readonly head: string; readonly body: string; readonly free: boolean }
  | { readonly type: "drop"; readonly id: number }
  | { readonly type: "toggle"; readonly id: number }
  | { readonly type: "reset" };

const patch = (thread: AskThread, id: number, update: (entry: AskEntry) => AskEntry): AskThread => ({
  ...thread,
  entries: thread.entries.map((entry) => (entry.id === id ? update(entry) : entry)),
});

const resolvedOf = (entry: AskEntry): string | null => (entry.kind === "clarify" ? null : entry.resolved);

const amountOf = (card: AskActionCard): Cents | null => (card.kind === "recordPayment" ? card.amount : null);

const toAction = (entry: AskEntry, action: AskActionView): ActionEntry => ({
  id: entry.id,
  question: entry.question,
  kind: "action",
  resolved: resolvedOf(entry),
  actionId: action.id,
  card: action.card,
  state: "ready",
  declining: false,
  error: null,
  fresh: null,
  amount: amountOf(action.card),
  skip: [],
});

export function threadReducer(thread: AskThread, action: ThreadAction): AskThread {
  switch (action.type) {
    case "ask":
      return {
        ...thread,
        entries: [...thread.entries, { id: action.id, question: action.question, kind: "thinking", steps: [], resolved: action.resolved }],
      };
    case "step":
      return patch(thread, action.id, (entry) => (entry.kind === "thinking" ? { ...entry, steps: [...entry.steps, action.step] } : entry));
    case "clarify":
      return {
        ...patch(thread, action.id, (entry) => ({
          id: entry.id,
          question: entry.question,
          kind: "clarify",
          questionId: action.questionId,
          questions: action.questions,
          picks: [],
          labels: [],
        })),
        threadId: action.threadId,
      };
    case "pick":
      return patch(thread, action.id, (entry) =>
        entry.kind === "clarify" ? { ...entry, picks: [...entry.picks, action.pick], labels: [...entry.labels, action.label] } : entry,
      );
    case "think":
      return patch(thread, action.id, (entry) => ({ id: entry.id, question: entry.question, kind: "thinking", steps: [], resolved: action.resolved }));
    case "answer":
      return {
        ...patch(thread, action.id, (entry) => ({
          id: entry.id,
          question: entry.question,
          kind: "answer",
          card: action.card,
          resolved: entry.kind === "thinking" ? entry.resolved : null,
        })),
        threadId: action.threadId,
      };
    case "propose":
      return { ...patch(thread, action.id, (entry) => toAction(entry, action.action)), threadId: action.threadId ?? thread.threadId };
    case "denied":
      return {
        ...patch(thread, action.id, (entry) => ({ id: entry.id, question: entry.question, kind: "denied", denied: action.denied, resolved: resolvedOf(entry) })),
        threadId: action.threadId ?? thread.threadId,
      };
    case "note":
      return {
        ...patch(thread, action.id, (entry) => ({ id: entry.id, question: entry.question, kind: "note", note: action.note, resolved: resolvedOf(entry) })),
        threadId: action.threadId ?? thread.threadId,
      };
    case "edit":
      return patch(thread, action.id, (entry) => (entry.kind === "action" ? { ...entry, ...action.patch } : entry));
    case "renew":
      return patch(thread, action.id, (entry) => (entry.kind === "action" && entry.fresh ? toAction(entry, entry.fresh) : entry));
    case "finish":
      return patch(thread, action.id, (entry) =>
        entry.kind === "action"
          ? { id: entry.id, question: entry.question, kind: "done", resolved: entry.resolved, actionId: entry.actionId, card: entry.card, outcome: action.outcome, undoing: false }
          : entry,
      );
    case "undoing":
      return patch(thread, action.id, (entry) => (entry.kind === "done" ? { ...entry, undoing: action.undoing } : entry));
    case "line":
      return patch(thread, action.id, (entry) => ({ id: entry.id, question: entry.question, kind: "line", head: action.head, body: action.body, free: action.free, resolved: resolvedOf(entry) }));
    case "drop":
      return { ...thread, entries: thread.entries.filter((entry) => entry.id !== action.id) };
    case "toggle":
      return { ...thread, open: { ...thread.open, [action.id]: !thread.open[action.id] } };
    case "reset":
      return EMPTY_THREAD;
  }
}

export const isBusy = (thread: AskThread) =>
  thread.entries.some((entry) => entry.kind === "thinking" || entry.kind === "clarify" || (entry.kind === "action" && entry.state === "working") || (entry.kind === "done" && entry.undoing));
