import type { PaletteTint } from "@/lib/design-system/tokens";
import { cents, splitEvenly, type Cents } from "@/lib/money";
import { heroDiners, lupaLines, type BillLine, type PersonId } from "../_data";

const PRINT_STEPS = lupaLines.length;
const CLAIM_STEPS = lupaLines.length;
export const LAST_STEP = PRINT_STEPS + CLAIM_STEPS + 1;

const DURATIONS = { idle: 700, print: 240, claim: 520, settled: 2600 } as const;

export function stepDuration(step: number): number {
  if (step === 0) return DURATIONS.idle;
  if (step <= PRINT_STEPS) return DURATIONS.print;
  if (step <= PRINT_STEPS + CLAIM_STEPS) return DURATIONS.claim;
  return DURATIONS.settled;
}

export function nextStep(step: number): number {
  return step >= LAST_STEP ? 0 : step + 1;
}

export interface HeroLine extends BillLine {
  readonly claimed: boolean;
}

export interface HeroStatus {
  readonly label: string;
  readonly tint: PaletteTint;
}

export interface HeroTotal {
  readonly id: PersonId;
  readonly amount: Cents;
}

export interface HeroFrame {
  readonly lines: readonly HeroLine[];
  readonly totals: readonly HeroTotal[];
  readonly status: HeroStatus;
  readonly settled: boolean;
}

const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);

function statusFor(printed: number, claimed: number, settled: boolean): HeroStatus {
  if (settled) return { label: "Settled", tint: "green" };
  if (claimed > 0) return { label: "Claiming", tint: "orange" };
  if (printed < PRINT_STEPS) return { label: "Reading", tint: "orange" };
  return { label: "Ready", tint: "blue" };
}

export function heroFrame(step: number): HeroFrame {
  const printed = clamp(step, PRINT_STEPS);
  const claimed = clamp(step - PRINT_STEPS, CLAIM_STEPS);
  const settled = step >= LAST_STEP;

  const sums = new Map<PersonId, number>(heroDiners.map((id) => [id, 0]));
  const lines = lupaLines.slice(0, printed).map((line, i): HeroLine => {
    const isClaimed = i < claimed;
    if (isClaimed) {
      splitEvenly(line.price, line.by.length).forEach((share, j) => {
        const id = line.by[j];
        if (id !== undefined) sums.set(id, (sums.get(id) ?? 0) + share);
      });
    }
    return { ...line, claimed: isClaimed };
  });

  return {
    lines,
    totals: heroDiners.map((id) => ({ id, amount: cents(sums.get(id) ?? 0) })),
    status: statusFor(printed, claimed, settled),
    settled,
  };
}
