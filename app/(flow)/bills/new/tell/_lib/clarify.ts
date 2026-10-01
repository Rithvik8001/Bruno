import type { PersonId } from "@/lib/domain/ids";
import type { Cents } from "@/lib/money";
import type { PersonView } from "@/lib/people/person";
import type { TellAnswers, TellPersonAnswer, TellQuestion, TellResult } from "@/lib/tell/result";

export interface ClarifyState {
  readonly people: Readonly<Record<number, TellPersonAnswer>>;
  readonly amount: Cents | null;
  readonly payerId: PersonId | null;
}

export const EMPTY_CLARIFY: ClarifyState = { people: {}, amount: null, payerId: null };

export type WhoContext =
  | { readonly kind: "item"; readonly item: string }
  | { readonly kind: "payer" }
  | { readonly kind: "none" };

export function whoContext(result: TellResult, person: number): WhoContext {
  const item = result.items.find((line) => line.claimants.includes(person));
  if (item) return { kind: "item", item: item.name.toLowerCase() };
  return result.payer === person ? { kind: "payer" } : { kind: "none" };
}

export function candidatesFor(result: TellResult, person: number, members: readonly PersonView[], you: PersonId): PersonView[] {
  const ids = new Set(result.people[person]?.memberIds ?? []);
  return ids.size > 1 ? members.filter((m) => ids.has(m.id)) : members.filter((m) => m.id !== you);
}

export function isAnswered(question: TellQuestion, state: ClarifyState): boolean {
  switch (question.kind) {
    case "who":
      return state.people[question.person] !== undefined;
    case "amount":
      return state.amount !== null && state.amount > 0;
    case "payer":
      return true;
  }
}

export function canSubmit(questions: readonly TellQuestion[], state: ClarifyState): boolean {
  return questions.every((question) => isAnswered(question, state));
}

export function toAnswers(state: ClarifyState): TellAnswers {
  return {
    people: Object.fromEntries(Object.entries(state.people).map(([index, answer]) => [index, answer])),
    amount: state.amount,
    payerId: state.payerId,
  };
}
