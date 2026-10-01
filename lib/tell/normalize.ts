import { BILL_ITEMS_MAX, BILL_TITLE_MAX, SPLIT_SHARES_MAX } from "@/lib/bills/schema";
import type { CurrencyCode } from "@/lib/currency";
import { normalizeName } from "@/lib/members/names";
import { cleanName, cleanQuantity, normalizeDate, validAmount } from "@/lib/scans/normalize";
import type { TellExtraction, TellExtractionItem } from "./extraction";
import { tellMessages } from "./messages";
import type { TellItem, TellPerson, TellQuestion, TellResult, TellSplit } from "./result";
import { TELL_PEOPLE_MAX, TELL_QUESTIONS_MAX } from "./rules";

export interface RosterEntry {
  readonly id: string;
  readonly name: string;
}

export interface TellRoster {
  readonly members: readonly RosterEntry[];
  readonly speaker: number;
}

const SPEAKER = /^(i|me|my|mine|myself)$/i;
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

function normalizePeople(raw: TellExtraction, roster: TellRoster): TellPerson[] {
  return raw.people.slice(0, TELL_PEOPLE_MAX).map((person) => {
    const name = cleanName(person.mention);
    return { name: name === "" ? "?" : name, memberIds: matchMention(person.mention, person.members, roster) };
  });
}

function validIndices(indices: readonly number[], count: number): number[] {
  return unique(indices).filter((index) => Number.isInteger(index) && index >= 0 && index < count);
}

function normalizeItem(item: TellExtractionItem, peopleCount: number): TellItem | null {
  const name = cleanName(item.name);
  if (name === "") return null;
  const claimants = validIndices(item.claimants, peopleCount);
  return {
    name,
    quantity: cleanQuantity(item.quantity),
    price: validAmount(item.lineTotalMinor),
    category: item.category,
    rest: item.isRemainder,
    everyone: item.everyone || (claimants.length === 0 && item.isRemainder),
    claimants,
  };
}

function settleRemainder(parsed: readonly TellItem[], stated: TellResult["stated"]): TellItem[] {
  if (stated === null) return parsed.map((item) => ({ ...item, rest: false }));
  const whole = parsed.length > 1 ? parsed.findIndex((item) => !item.rest && item.price === stated) : -1;
  const flagged = parsed.findIndex((item) => item.rest && item.price === null);
  if (whole === -1) return parsed.map((item, index) => ({ ...item, rest: index === flagged }));
  if (flagged !== -1) return parsed.filter((_, index) => index !== whole).map((item) => ({ ...item, rest: item === parsed[flagged] }));
  return parsed.map((item, index) => (index === whole ? { ...item, price: null, rest: true, everyone: item.claimants.length === 0 } : { ...item, rest: false }));
}

function normalizeSplit(raw: TellExtraction["split"], peopleCount: number): TellSplit | null {
  if (raw === null || raw.method === "EVEN") return null;
  const parts = raw.parts
    .filter((part) => Number.isInteger(part.person) && part.person >= 0 && part.person < peopleCount)
    .map((part) => ({
      person: part.person,
      shares: part.shares !== null && Number.isInteger(part.shares) && part.shares >= 1 && part.shares <= SPLIT_SHARES_MAX ? part.shares : null,
      percent: part.percent !== null && Number.isInteger(part.percent) && part.percent >= 0 && part.percent <= 100 ? part.percent : null,
      amount: validAmount(part.amountMinor),
    }));
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

function normalizeTitle(raw: string | null): string | null {
  if (raw === null) return null;
  const title = cleanName(raw).slice(0, BILL_TITLE_MAX);
  return title === "" ? null : title;
}

export function normalizeTell(raw: TellExtraction, roster: TellRoster, currency: CurrencyCode, now: Date = new Date()): TellResult {
  const people = normalizePeople(raw, roster);
  const title = normalizeTitle(raw.title);
  const stated = validAmount(raw.statedTotalMinor);
  const parsed = raw.items
    .map((item) => normalizeItem(item, people.length))
    .filter((item): item is TellItem => item !== null)
    .slice(0, BILL_ITEMS_MAX);
  const listed = settleRemainder(parsed, stated);
  const items: TellItem[] =
    listed.length > 0
      ? listed
      : [
          {
            name: title ?? tellMessages.fallbackItem,
            quantity: 1,
            price: stated,
            category: null,
            rest: false,
            everyone: true,
            claimants: [],
          },
        ];
  const single = items.length === 1 ? items[0] : undefined;
  const settled: TellItem[] = single && single.price === null && stated !== null ? [{ ...single, price: stated, rest: false }] : items;
  const payer = raw.payer !== null && Number.isInteger(raw.payer) && raw.payer >= 0 && raw.payer < people.length ? raw.payer : null;
  const tipPercent = raw.tipPercent !== null && Number.isInteger(raw.tipPercent) && raw.tipPercent > 0 && raw.tipPercent <= 100 ? raw.tipPercent : null;
  const base: Omit<TellResult, "questions"> = {
    title,
    occurredOn: normalizeDate(raw.date, now),
    currency,
    stated,
    people,
    payer,
    items: settled,
    tax: validAmount(raw.taxMinor),
    tip: tipPercent === null ? validAmount(raw.tipMinor) : null,
    tipPercent,
    discount: validAmount(raw.discountMinor),
    split: normalizeSplit(raw.split, people.length),
  };
  return { ...base, questions: questionsFor(base) };
}

export function isUsable(raw: TellExtraction, result: TellResult): boolean {
  if (raw.problem !== "none") return false;
  const priced = result.items.some((item) => item.price !== null);
  return priced || result.stated !== null || result.title !== null || raw.items.length > 0;
}
