import { TELL_MIN_LETTERS, TELL_MIN_WORDS } from "./rules";

const CONTROL = /\p{Cc}/gu;
const INVISIBLE = /\p{Cf}/gu;
const WORD = /[\p{L}\p{M}]+/gu;
const NUMBER = /(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*(k\b)?/gi;
const STEM = 4;
const STEM_MIN = 3;

const SPOKEN_PERCENT: readonly (readonly [RegExp, number])[] = [
  [/\bhalf\b/i, 50],
  [/\bquarter\b/i, 25],
];

export function cleanTellText(raw: string): string {
  return raw.normalize("NFKC").replace(INVISIBLE, "").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

export function forPrompt(text: string): string {
  return text.replace(/[<>]/g, " ");
}

function wordsIn(text: string): string[] {
  return (text.toLowerCase().match(WORD) ?? []).filter(Boolean);
}

export function hasSubstance(text: string): boolean {
  const words = wordsIn(text);
  if (words.join("").length < TELL_MIN_LETTERS) return false;
  return words.length >= TELL_MIN_WORDS || /\d/.test(text);
}

export interface SaidNumbers {
  readonly plain: ReadonlySet<number>;
  readonly minor: ReadonlySet<number>;
  readonly percents: ReadonlySet<number>;
}

export function numbersSaid(text: string, minorUnits: number): SaidNumbers {
  const scale = 10 ** minorUnits;
  const plain = new Set<number>();
  const minor = new Set<number>();
  for (const match of text.matchAll(NUMBER)) {
    const value = Number(`${(match[1] ?? "").replace(/,/g, "")}${match[2] ?? ""}`) * (match[3] ? 1000 : 1);
    if (!Number.isFinite(value)) continue;
    plain.add(value);
    minor.add(Math.round(value * scale));
  }
  const percents = new Set<number>(plain);
  for (const [pattern, percent] of SPOKEN_PERCENT) if (pattern.test(text)) percents.add(percent);
  return { plain, minor, percents };
}

export function saidAmount(value: number | null, said: SaidNumbers, minorUnits: number): number | null {
  if (value === null || !Number.isSafeInteger(value) || value <= 0) return null;
  if (said.minor.has(value)) return value;
  const scaled = value * 10 ** minorUnits;
  return minorUnits > 0 && said.minor.has(scaled) ? scaled : null;
}

export function saidPercent(value: number | null, said: SaidNumbers): number | null {
  return value !== null && said.percents.has(value) ? value : null;
}

const stemOf = (word: string) => word.slice(0, STEM);

export function saidLabel(label: string, text: string): boolean {
  const lowered = text.toLowerCase();
  const stems = new Set(
    wordsIn(text)
      .filter((word) => word.length >= STEM_MIN)
      .map(stemOf),
  );
  return wordsIn(label).some((word) => (word.length >= STEM_MIN && stems.has(stemOf(word))) || (word.length >= 2 && lowered.includes(word)));
}

export function saidName(mention: string, text: string): boolean {
  const name = mention.trim().toLowerCase();
  return name !== "" && text.toLowerCase().includes(name);
}
