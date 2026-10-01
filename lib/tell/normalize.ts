import { AMOUNT_MAX_CENTS, BILL_TITLE_MAX, SPLIT_SHARES_MAX } from "@/lib/bills/schema";
import type { CurrencyCode } from "@/lib/currency";
import { normalizeName } from "@/lib/members/names";
import { cents, type Cents } from "@/lib/money";
import { DISPLAY_NAME_MAX } from "@/lib/people/schema";
import { cleanName, cleanQuantity, normalizeDate } from "@/lib/scans/normalize";
import type { TellExtraction, TellExtractionItem } from "./extraction";
import { numbersSaid, saidAmount, saidLabel, saidName, saidPercent, type SaidNumbers } from "./guard";
import { tellMessages } from "./messages";
import type { TellItem, TellPerson, TellQuestion, TellResult, TellSplit } from "./result";
import { TELL_ITEMS_MAX, TELL_LABEL_MAX, TELL_PEOPLE_MAX, TELL_QUESTIONS_MAX } from "./rules";

export interface RosterEntry {
  readonly id: string;
  readonly name: string;
}

export interface TellRoster {
  readonly members: readonly RosterEntry[];
  readonly speaker: number;
}

export interface TellSource {
  readonly text: string;
  readonly roster: TellRoster;
  readonly currency: CurrencyCode;
  readonly minorUnits: number;
}

export interface NormalizedTell {
  readonly result: TellResult;
  readonly usable: boolean;
}

const SPEAKER = /^(i|me|my|mine|myself|we|us|our)$/i;
const PREFIX_MIN = 3;

function wordsOf(name: string): string[] {
  return normalizeName(name).toLowerCase().split(" ").filter(Boolean);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function matchMention(mention: string, modelPicks: readonly number[], roster: TellRoster): string[] {
  const said = normalizeName(mention).toLowerCase();
  const speaker = roster.members[roster.speaker];
  if (SPEAKER.test(said)) return speaker ? [speaker.id] : [];
  const full = roster.members.filter((m) => normalizeName(m.name).toLowerCase() === said);
  if (full.length === 1) return full.map((m) => m.id);
  const saidWords = wordsOf(mention);
  const exact = roster.members.filter((m) => {
    const words = wordsOf(m.name);
    return saidWords.length > 0 && saidWords.every((w) => words.includes(w));
  });
  if (exact.length > 0) return exact.map((m) => m.id);
  const first = saidWords.length === 1 ? saidWords[0] : undefined;
  const prefix =
    first !== undefined && first.length >= PREFIX_MIN ? roster.members.filter((m) => wordsOf(m.name)[0]?.startsWith(first) === true) : [];
  if (prefix.length > 0) return prefix.map((m) => m.id);
  return unique(modelPicks)
    .map((index) => roster.members[index]?.id)
    .filter((id): id is string => id !== undefined);
}

interface PeopleMap {
  readonly people: TellPerson[];
  readonly indexOf: ReadonlyMap<number, number>;
}

function normalizePeople(raw: TellExtraction, source: TellSource): PeopleMap {
  const people: TellPerson[] = [];
  const indexOf = new Map<number, number>();
  raw.people.forEach((person, index) => {
    if (people.length >= TELL_PEOPLE_MAX) return;
    const name = normalizeName(person.mention).slice(0, DISPLAY_NAME_MAX).trim();
    if (name === "") return;
    if (!SPEAKER.test(name) && !saidName(name, source.text)) return;
    indexOf.set(index, people.length);
    people.push({ name, memberIds: matchMention(name, person.members, source.roster) });
  });
  return { people, indexOf };
}

function mapIndices(indices: readonly number[], indexOf: ReadonlyMap<number, number>): number[] {
  return unique(indices.flatMap((index) => indexOf.get(index) ?? []));
}

function amountOf(value: number | null, said: SaidNumbers, minorUnits: number): Cents | null {
  const amount = saidAmount(value, said, minorUnits);
  return amount === null || amount > AMOUNT_MAX_CENTS ? null : cents(amount);
}

function labelOf(raw: string, max: number): string {
  return cleanName(raw).slice(0, max).trim();
}

interface ItemContext {
  readonly source: TellSource;
  readonly said: SaidNumbers;
  readonly indexOf: ReadonlyMap<number, number>;
  readonly fallback: string;
}

function normalizeItem(item: TellExtractionItem, { source, said, indexOf, fallback }: ItemContext): { item: TellItem; named: boolean } | null {
  const label = labelOf(item.name, TELL_LABEL_MAX);
  if (label === "") return null;
  const named = saidLabel(label, source.text);
  const claimants = mapIndices(item.claimants, indexOf);
  return {
    named,
    item: {
      name: named ? label : fallback,
      quantity: cleanQuantity(item.quantity),
      price: amountOf(item.lineTotalMinor, said, source.minorUnits),
      category: item.category,
      rest: item.isRemainder,
      everyone: item.everyone || (claimants.length === 0 && item.isRemainder),
      claimants,
    },
  };
}

function settleRemainder(parsed: readonly TellItem[], stated: Cents | null): TellItem[] {
  if (stated === null) return parsed.map((item) => ({ ...item, rest: false }));
  const whole = parsed.length > 1 ? parsed.findIndex((item) => !item.rest && item.price === stated) : -1;
  const flagged = parsed.findIndex((item) => item.rest && item.price === null);
  if (whole === -1) return parsed.map((item, index) => ({ ...item, rest: index === flagged }));
  if (flagged !== -1) return parsed.filter((_, index) => index !== whole).map((item) => ({ ...item, rest: item === parsed[flagged] }));
  return parsed.map((item, index) => (index === whole ? { ...item, price: null, rest: true, everyone: item.claimants.length === 0 } : { ...item, rest: false }));
}

function normalizeSplit(raw: TellExtraction["split"], said: SaidNumbers, source: TellSource, indexOf: ReadonlyMap<number, number>): TellSplit | null {
  if (raw === null || raw.method === "EVEN") return null;
  const seen = new Set<number>();
  const parts = raw.parts.flatMap((part) => {
    const person = indexOf.get(part.person);
    if (person === undefined || seen.has(person)) return [];
    seen.add(person);
    return [
      {
        person,
        shares: part.shares !== null && Number.isInteger(part.shares) && part.shares >= 1 && part.shares <= SPLIT_SHARES_MAX ? part.shares : null,
        percent: part.percent !== null && part.percent >= 0 && part.percent <= 100 ? saidPercent(part.percent, said) : null,
        amount: amountOf(part.amountMinor, said, source.minorUnits),
      },
    ];
  });
  const numbered = (part: (typeof parts)[number]) =>
    raw.method === "SHARES" ? part.shares !== null : raw.method === "PERCENT" ? part.percent !== null : part.amount !== null;
  return parts.some(numbered) ? { method: raw.method, parts } : null;
}

function referenced(result: Pick<TellResult, "payer" | "items" | "split">): number[] {
  return unique([
    ...result.items.flatMap((item) => item.claimants),
    ...(result.split?.parts.map((part) => part.person) ?? []),
    ...(result.payer === null ? [] : [result.payer]),
  ]).sort((a, b) => a - b);
}

function questionsFor(result: Omit<TellResult, "questions">): TellQuestion[] {
  const who: TellQuestion[] = referenced(result)
    .filter((index) => result.people[index]?.memberIds.length !== 1)
    .map((index) => ({ kind: "who", person: index }));
  const priced = result.items.some((item) => item.price !== null);
  const amount: TellQuestion[] = result.stated === null && !priced ? [{ kind: "amount" }] : [];
  const payer: TellQuestion[] = result.payer === null ? [{ kind: "payer" }] : [];
  const asked = [...who, ...amount].slice(0, TELL_QUESTIONS_MAX);
  if (asked.length === 0) return [];
  return [...asked, ...payer].slice(0, TELL_QUESTIONS_MAX);
}

function normalizeTitle(raw: string | null, text: string): string | null {
  if (raw === null) return null;
  const title = labelOf(raw, Math.min(BILL_TITLE_MAX, TELL_LABEL_MAX));
  return title !== "" && saidLabel(title, text) ? title : null;
}

export function normalizeTell(raw: TellExtraction, source: TellSource, now: Date = new Date()): NormalizedTell {
  const said = numbersSaid(source.text, source.minorUnits);
  const { people, indexOf } = normalizePeople(raw, source);
  const title = normalizeTitle(raw.title, source.text);
  const stated = amountOf(raw.statedTotalMinor, said, source.minorUnits);
  const fallback = title ?? tellMessages.fallbackItem;
  const parsed = raw.items
    .slice(0, TELL_ITEMS_MAX)
    .map((item) => normalizeItem(item, { source, said, indexOf, fallback }))
    .filter((entry): entry is { item: TellItem; named: boolean } => entry !== null);
  const listed = settleRemainder(
    parsed.map((entry) => entry.item),
    stated,
  );
  const items: TellItem[] =
    listed.length > 0 ? listed : [{ name: fallback, quantity: 1, price: stated, category: null, rest: false, everyone: true, claimants: [] }];
  const single = items.length === 1 ? items[0] : undefined;
  const settled: TellItem[] = single && single.price === null && stated !== null ? [{ ...single, price: stated, rest: false }] : items;
  const payer = raw.payer === null ? null : (indexOf.get(raw.payer) ?? null);
  const tipPercent = raw.tipPercent !== null && raw.tipPercent > 0 && raw.tipPercent <= 100 ? saidPercent(raw.tipPercent, said) : null;
  const base: Omit<TellResult, "questions"> = {
    title,
    occurredOn: normalizeDate(raw.date, now),
    currency: source.currency,
    stated,
    people,
    payer,
    items: settled,
    tax: amountOf(raw.taxMinor, said, source.minorUnits),
    tip: tipPercent === null ? amountOf(raw.tipMinor, said, source.minorUnits) : null,
    tipPercent,
    discount: amountOf(raw.discountMinor, said, source.minorUnits),
    split: normalizeSplit(raw.split, said, source, indexOf),
  };
  const priced = settled.some((item) => item.price !== null);
  const usable = raw.problem === "none" && (priced || stated !== null || title !== null || parsed.some((entry) => entry.named));
  return { result: { ...base, questions: questionsFor(base) }, usable };
}
