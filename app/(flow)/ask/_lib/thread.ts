import type { AskCard, AskClarifyQuestion, AskPick, AskStep } from "@/lib/ask/result";

export type AskEntry =
  | { readonly id: number; readonly question: string; readonly kind: "thinking"; readonly steps: readonly AskStep[]; readonly resolved: string | null }
  | {
      readonly id: number;
      readonly question: string;
      readonly kind: "clarify";
      readonly questionId: string;
      readonly questions: readonly AskClarifyQuestion[];
      readonly picks: readonly AskPick[];
      readonly labels: readonly string[];
    }
  | { readonly id: number; readonly question: string; readonly kind: "answer"; readonly card: AskCard; readonly resolved: string | null };

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
  | { readonly type: "drop"; readonly id: number }
  | { readonly type: "toggle"; readonly id: number }
  | { readonly type: "reset" };

const patch = (thread: AskThread, id: number, update: (entry: AskEntry) => AskEntry): AskThread => ({
  ...thread,
  entries: thread.entries.map((entry) => (entry.id === id ? update(entry) : entry)),
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
    case "drop":
      return { ...thread, entries: thread.entries.filter((entry) => entry.id !== action.id) };
    case "toggle":
      return { ...thread, open: { ...thread.open, [action.id]: !thread.open[action.id] } };
    case "reset":
      return EMPTY_THREAD;
  }
}

export const isBusy = (thread: AskThread) => thread.entries.some((entry) => entry.kind !== "answer");
