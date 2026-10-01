import { pendingGuestId, type PendingGuest } from "@/lib/members/pending";
import { personId, type PersonId } from "@/lib/domain/ids";
import { cents, type Cents } from "@/lib/money";
import type { TellAnswers, TellResult } from "@/lib/tell/result";
import { draftTotals, filledItems } from "./derive";
import { emptyDraft, type BillDraft, type DraftItem, type DraftMarks, type SplitPerson } from "./draft";
import type { ReceiptCheck } from "./scan";
import type { FlowStep } from "./steps";

export interface ToldDraft {
  readonly draft: BillDraft;
  readonly guests: readonly PendingGuest[];
  readonly step: FlowStep;
}

const guestKey = (index: number) => `g${index}`;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function pendingGuestsOf(result: TellResult, answers: TellAnswers): PendingGuest[] {
  return result.people.flatMap((person, index) =>
    answers.people[String(index)]?.kind === "guest" ? [{ key: guestKey(index), name: person.name }] : [],
  );
}

function resolver(result: TellResult, answers: TellAnswers, members: ReadonlySet<PersonId>) {
  return (index: number): PersonId | null => {
    const person = result.people[index];
    if (!person) return null;
    const answer = answers.people[String(index)];
    if (answer?.kind === "guest") return pendingGuestId(guestKey(index));
    if (answer?.kind === "skip") return null;
    const picked = answer?.kind === "member" ? answer.id : person.memberIds.length === 1 ? person.memberIds[0] : undefined;
    if (picked === undefined) return null;
    const id = personId(picked);
    return members.has(id) ? id : null;
  };
}

function restPrice(items: readonly DraftItem[], restKey: string, stated: Cents): Cents | null {
  const others = items.reduce((sum, item) => (item.key === restKey ? sum : sum + (item.price ?? 0)), 0);
  const left = stated - others;
  return left > 0 ? cents(left) : null;
}

export function draftFromTell(
  result: TellResult,
  answers: TellAnswers,
  members: readonly PersonId[],
  you: PersonId,
  today: string,
): ToldDraft {
  const guests = pendingGuestsOf(result, answers);
  const everyone = [...members];
  const known = new Set<PersonId>([...members, ...guests.map((guest) => pendingGuestId(guest.key))]);
  const resolve = resolver(result, answers, known);
  const base = emptyDraft([...known], you, today);
  const stated = result.stated ?? answers.amount;
  const single = result.items.length === 1;

  const listed: DraftItem[] = result.items.map((item, index) => ({
    key: `item-${index}`,
    name: item.name,
    quantity: item.quantity,
    price: item.price ?? (single ? stated : null),
    category: item.category,
    hints: null,
  }));
  const restIndex = stated === null ? -1 : result.items.findIndex((item) => item.rest);
  const restKey = restIndex === -1 ? null : `item-${restIndex}`;
  const items = listed.map((item) => (restKey !== null && stated !== null && item.key === restKey ? { ...item, price: restPrice(listed, restKey, stated) } : item));

  const claims = Object.fromEntries(
    result.items.map((item, index) => [
      `item-${index}`,
      item.everyone ? everyone : unique(item.claimants.map(resolve).filter((id): id is PersonId => id !== null)),
    ]),
  );

  const statedPayer = result.payer === null ? null : resolve(result.payer);
  const answeredPayer = answers.payerId !== null && known.has(personId(answers.payerId)) ? personId(answers.payerId) : null;
  const payerId = statedPayer ?? answeredPayer ?? you;

  const parts = (result.split?.parts ?? []).flatMap((part) => {
    const id = resolve(part.person);
    return id === null ? [] : [{ id, part }];
  });
  const split = result.split !== null && parts.length > 0 ? result.split : null;
  const people: Record<PersonId, SplitPerson> = { ...base.people };
  if (split !== null) {
    const listed = new Set(parts.map(({ id }) => id));
    if (listed.size > 1) for (const id of known) people[id] = { ...base.people[id], included: listed.has(id), shares: 1, percent: null, amount: null };
    const open = parts.filter(({ part }) => (split.method === "PERCENT" ? part.percent === null : split.method === "AMOUNT" ? part.amount === null : false));
    const percentLeft = 100 - parts.reduce((sum, { part }) => sum + (part.percent ?? 0), 0);
    const amountLeft = stated === null ? null : stated - parts.reduce((sum, { part }) => sum + (part.amount ?? 0), 0);
    const rest = open.length === 1 ? open[0]?.id : undefined;
    for (const { id, part } of parts) {
      people[id] = {
        included: true,
        shares: part.shares ?? 1,
        percent: part.percent ?? (id === rest && split.method === "PERCENT" && percentLeft > 0 ? percentLeft : null),
        amount: part.amount ?? (id === rest && split.method === "AMOUNT" && amountLeft !== null && amountLeft > 0 ? cents(amountLeft) : null),
      };
    }
  }

  const marks: DraftMarks = {
    payerGuessed: statedPayer === null && answeredPayer === null,
    everyone: result.items.flatMap((item, index) => (item.everyone ? [`item-${index}`] : [])),
    restKey,
    stated,
  };

  return {
    draft: {
      ...base,
      title: result.title ?? "",
      occurredOn: result.occurredOn ?? today,
      payerId,
      items,
      nextKey: items.length,
      tax: result.tax,
      tip:
        result.tipPercent !== null
          ? { mode: "percent", percent: result.tipPercent }
          : result.tip !== null
            ? { mode: "amount", amount: result.tip }
            : { mode: "none" },
      discount: result.discount,
      claims,
      method: split?.method ?? "EVEN",
      people,
      marks,
    },
    guests,
    step: split === null ? "items" : "split",
  };
}

function sameIds(a: readonly PersonId[] | undefined, b: readonly PersonId[] | undefined): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function reconcileMarks(before: BillDraft, after: BillDraft): BillDraft {
  const marks = after.marks;
  if (!marks) return after;
  const keys = new Set(after.items.map((item) => item.key));
  const everyone = marks.everyone.filter((key) => keys.has(key) && sameIds(before.claims[key], after.claims[key]));
  const payerGuessed = marks.payerGuessed && before.payerId === after.payerId;
  const priceOf = (draft: BillDraft, key: string) => draft.items.find((item) => item.key === key)?.price ?? null;
  const restKept =
    marks.restKey !== null && marks.stated !== null && keys.has(marks.restKey) && priceOf(before, marks.restKey) === priceOf(after, marks.restKey);
  const restKey = restKept ? marks.restKey : null;
  const items =
    restKey !== null && marks.stated !== null
      ? after.items.map((item) => (item.key === restKey ? { ...item, price: restPrice(after.items, restKey, marks.stated ?? cents(0)) } : item))
      : after.items;
  return { ...after, items, marks: { ...marks, everyone, payerGuessed, restKey } };
}

export function confirmPayer(draft: BillDraft): BillDraft {
  return draft.marks ? { ...draft, marks: { ...draft.marks, payerGuessed: false } } : draft;
}

export function confirmEveryone(draft: BillDraft, key: string): BillDraft {
  return draft.marks ? { ...draft, marks: { ...draft.marks, everyone: draft.marks.everyone.filter((k) => k !== key) } } : draft;
}

export function isUnpriced(item: DraftItem): boolean {
  return item.name.trim() !== "" && item.price === null;
}

export function unpricedCount(draft: BillDraft): number {
  return filledItems(draft).filter(isUnpriced).length;
}

export function guessCount(draft: BillDraft): number {
  const marks = draft.marks;
  if (!marks) return 0;
  const claimed = marks.everyone.filter((key) => (draft.claims[key]?.length ?? 0) > 0).length;
  return unpricedCount(draft) + claimed + (marks.payerGuessed ? 1 : 0);
}

export function saidCheck(draft: BillDraft, printing: boolean): ReceiptCheck {
  if (printing) return { kind: "printing" };
  const stated = draft.marks?.stated ?? null;
  const unresolved = unpricedCount(draft);
  if (unresolved > 0) return { kind: "unresolved", printed: stated, count: unresolved };
  const totals = draftTotals(draft);
  if (!totals || stated === null) return { kind: "plain" };
  if (totals.total === stated) return { kind: "match", total: totals.total };
  return { kind: "off", total: totals.total, printed: stated, diff: cents(Math.abs(totals.total - stated)) };
}
