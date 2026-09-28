export const BUDDY_SHAPES = ["mochi", "miso", "bun", "bolt", "bruin", "sprout", "swoop", "pom"] as const;
export type BuddyShape = (typeof BUDDY_SHAPES)[number];

export interface BuddyShapeInfo {
  readonly name: string;
  readonly trait: string;
}

export const buddyShapes = {
  mochi: { name: "Mochi", trait: "Bowl cut" },
  miso: { name: "Miso", trait: "Cat ears" },
  bun: { name: "Bun", trait: "Bunny ears" },
  bolt: { name: "Bolt", trait: "Antenna + cans" },
  bruin: { name: "Bruin", trait: "Bear ears" },
  sprout: { name: "Sprout", trait: "Leaf sprout" },
  swoop: { name: "Swoop", trait: "Side fringe" },
  pom: { name: "Pom", trait: "Beanie" },
} as const satisfies Record<BuddyShape, BuddyShapeInfo>;

export const BUDDY_BLUSH_MIN_SIZE = 22;

export function buddyHash(seed: string): number {
  let h = 7;
  for (const char of seed) h = (Math.imul(h, 31) + char.charCodeAt(0)) >>> 0;
  return h;
}

export function isBuddyShape(value: string): value is BuddyShape {
  return (BUDDY_SHAPES as readonly string[]).includes(value);
}

export function buddyShapeFor(seed: string, chosen?: BuddyShape | null): BuddyShape {
  if (chosen) return chosen;
  return BUDDY_SHAPES[buddyHash(seed) % BUDDY_SHAPES.length] ?? "mochi";
}

export interface BlinkTiming {
  readonly delaySeconds: number;
  readonly durationSeconds: number;
}

export function buddyBlink(seed: string, shape: BuddyShape): BlinkTiming {
  return {
    delaySeconds: (buddyHash(seed + shape) % 40) / 10,
    durationSeconds: 3.6 + (buddyHash(seed) % 25) / 10,
  };
}
