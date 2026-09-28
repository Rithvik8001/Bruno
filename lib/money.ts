declare const centsBrand: unique symbol;
export type Cents = number & { readonly [centsBrand]: "Cents" };

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, got ${value}`);
  }
  return value as Cents;
}

export function sumCents(values: readonly Cents[]): Cents {
  return cents(values.reduce<number>((a, b) => a + b, 0));
}

export function splitEvenly(total: Cents, ways: number): Cents[] {
  if (!Number.isInteger(ways) || ways < 1) {
    throw new RangeError(`ways must be a positive integer, got ${ways}`);
  }
  const base = Math.trunc(total / ways);
  const remainder = total - base * ways;
  return Array.from({ length: ways }, (_, i) => cents(base + (i < remainder ? 1 : 0)));
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
