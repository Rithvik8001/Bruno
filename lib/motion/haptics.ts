export type HapticPattern = number | readonly number[];

export const HAPTICS = {
  press: 5,
  addPress: 6,
  select: 8,
  celebrate: [10, 40, 10],
  error: [4, 30, 4],
} as const satisfies Record<string, HapticPattern>;

export function buzz(pattern: HapticPattern): void {
  try {
    navigator.vibrate?.(typeof pattern === "number" ? pattern : [...pattern]);
  } catch {}
}
