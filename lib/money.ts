declare const centsBrand: unique symbol;
export type Cents = number & { readonly [centsBrand]: "Cents" };

export const ZERO_CENTS = 0 as Cents;

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, got ${value}`);
  }
  return value as Cents;
}

export function sumCents(values: readonly Cents[]): Cents {
  return cents(values.reduce<number>((a, b) => a + b, 0));
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

export function negateCents(value: Cents): Cents {
  return cents(value === 0 ? 0 : -value);
}

export function allocate(total: Cents, weights: readonly number[]): Cents[] {
  if (weights.length === 0) throw new RangeError("allocate needs at least one weight");
  if (weights.some((w) => !Number.isSafeInteger(w) || w < 0)) {
    throw new RangeError("allocate weights must be non-negative safe integers");
  }
  const weightSum = BigInt(weights.reduce((a, b) => a + b, 0));
  if (weightSum === BigInt(0)) throw new RangeError("allocate weights must not all be zero");

  const sign = total < 0 ? -1 : 1;
  const magnitude = BigInt(Math.abs(total));
  const parts = weights.map((w, index) => {
    const scaled = magnitude * BigInt(w);
    return { index, weight: w, quotient: scaled / weightSum, remainder: scaled % weightSum };
  });
  let leftover = magnitude - parts.reduce((a, p) => a + p.quotient, BigInt(0));

  const byRemainder = parts
    .filter((p) => p.weight > 0)
    .sort((a, b) => (a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1));
  const bonus = new Set<number>();
  for (const part of byRemainder) {
    if (leftover === BigInt(0)) break;
    bonus.add(part.index);
    leftover -= BigInt(1);
  }

  return parts.map((p) => {
    const value = Number(p.quotient) + (bonus.has(p.index) ? 1 : 0);
    return cents(value === 0 ? 0 : sign * value);
  });
}

export function splitEvenly(total: Cents, ways: number): Cents[] {
  if (!Number.isInteger(ways) || ways < 1) {
    throw new RangeError(`ways must be a positive integer, got ${ways}`);
  }
  return allocate(total, Array.from({ length: ways }, () => 1));
}

const MINUS = "−";

export type SignDisplay = "auto" | "always" | "never";

export function formatCents(value: Cents, sign: SignDisplay = "auto"): string {
  const abs = Math.abs(value);
  const body = `${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  if (sign === "never" || value === 0) return body;
  if (value < 0) return `${MINUS}${body}`;
  return sign === "always" ? `+${body}` : body;
}

export function parseDigitsToCents(input: string, maxDigits = 9): Cents | null {
  const digits = input.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits);
  return digits ? cents(parseInt(digits, 10)) : null;
}
