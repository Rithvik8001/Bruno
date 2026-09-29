import { buzz, HAPTICS } from "./haptics";

export type ConfettiSize = "full" | "small";

export interface ConfettiPiece {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  readonly tint: string;
  readonly dx: number;
  readonly dy: number;
  readonly fall: number;
  readonly rotate: number;
  readonly duration: number;
}

export interface ConfettiBurst {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly pieces: readonly ConfettiPiece[];
}

const TINTS = ["--violet", "--pink", "--amber", "--green", "--blue", "--orange", "--surface-2"] as const;
const SPEC = {
  full: { count: 22, minV: 90, spanV: 110, fall: 180, minMs: 1100, spanMs: 500, cone: 2.2 },
  small: { count: 10, minV: 40, spanV: 40, fall: 30, minMs: 700, spanMs: 250, cone: 2.4 },
} as const satisfies Record<ConfettiSize, object>;

const NO_BURSTS: readonly ConfettiBurst[] = [];
let bursts: readonly ConfettiBurst[] = NO_BURSTS;
let seq = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function subscribeConfetti(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const confettiSnapshot = () => bursts;
export const emptyConfetti = () => NO_BURSTS;

function originOf(from: Element | { x: number; y: number }): { x: number; y: number } {
  if (!(from instanceof Element)) return from;
  const r = from.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 40) };
}

export function fireConfetti(from: Element | { x: number; y: number }, size: ConfettiSize = "full"): void {
  const spec = SPEC[size];
  const { x, y } = originOf(from);
  const pieces = Array.from({ length: spec.count }, (_, i): ConfettiPiece => {
    const width = 5 + Math.random() * 4;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spec.cone;
    const v = spec.minV + Math.random() * spec.spanV;
    return {
      id: i,
      width,
      height: width * (1.3 + Math.random() * 0.6),
      tint: TINTS[i % TINTS.length] ?? "--violet",
      dx: Math.cos(angle) * v,
      dy: Math.sin(angle) * v,
      fall: spec.fall,
      rotate: (Math.random() - 0.5) * 720,
      duration: (spec.minMs + Math.random() * spec.spanMs) / 1000,
    };
  });
  const id = ++seq;
  bursts = [...bursts, { id, x, y, pieces }];
  emit();
  if (size === "full") buzz(HAPTICS.celebrate);
  window.setTimeout(() => {
    bursts = bursts.filter((b) => b.id !== id);
    emit();
  }, spec.minMs + spec.spanMs + 100);
}
