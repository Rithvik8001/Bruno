
export type Hex = `#${string}`;

export const THEMES = ["light", "dark"] as const;
export type ThemeName = (typeof THEMES)[number];

export const PALETTE_TINTS = [
  "violet",
  "blue",
  "orange",
  "red",
  "green",
  "pink",
  "amber",
  "cyan",
  "indigo",
] as const;
export type PaletteTint = (typeof PALETTE_TINTS)[number];

export const TINTS = [...PALETTE_TINTS, "brand", "neutral", "muted"] as const;
export type Tint = (typeof TINTS)[number];

export const NEUTRAL_KEYS = [
  "bg",
  "surface",
  "surface-2",
  "line",
  "border",
  "muted",
  "text-2",
  "text",
] as const;
export type NeutralKey = (typeof NEUTRAL_KEYS)[number];

export const NEUTRAL_ROLES = {
  bg: "canvas",
  surface: "surface",
  "surface-2": "raised",
  line: "hairline",
  border: "border",
  muted: "muted",
  "text-2": "secondary",
  text: "text",
} as const satisfies Record<NeutralKey, string>;

export interface TintPair {
  readonly bg: Hex;
  readonly fg: Hex;
}

export interface BrandScale {
  readonly brand: Hex;
  readonly "brand-tint": Hex;
  readonly "brand-hover": Hex;
  readonly "on-brand": Hex;
}

export interface BuddyColours {
  readonly face: Hex;
  readonly ink: Hex;
  readonly blush: Hex;
}

export interface ThemePalette {
  readonly neutral: Readonly<Record<NeutralKey, Hex>>;
  readonly brand: BrandScale;
  readonly tints: Readonly<Record<PaletteTint, TintPair>>;
  readonly buddy: BuddyColours;
  readonly shadow: string;
  readonly shadowThumb: string;
}

export const palettes = {
  light: {
    neutral: {
      bg: "#FFFFFF",
      surface: "#F7F7F5",
      "surface-2": "#EFEFEC",
      line: "#E9E9E6",
      border: "#D9D9D5",
      muted: "#8A8985",
      "text-2": "#5F5E5A",
      text: "#1A1917",
    },
    brand: {
      brand: "#6D3CF5",
      "brand-tint": "#F0EAFF",
      "brand-hover": "#5B2FD9",
      "on-brand": "#FFFFFF",
    },
    tints: {
      violet: { bg: "#F1EAFF", fg: "#6D28D9" },
      blue: { bg: "#E6F0FF", fg: "#0B5ED7" },
      orange: { bg: "#FFF0E0", fg: "#A84B00" },
      red: { bg: "#FFE9EC", fg: "#C41E4A" },
      green: { bg: "#E1F6EE", fg: "#087A58" },
      pink: { bg: "#FCE8FA", fg: "#B0239F" },
      amber: { bg: "#FBF2DC", fg: "#8A5F00" },
      cyan: { bg: "#E2F5F8", fg: "#067087" },
      indigo: { bg: "#E8ECFF", fg: "#3B46C4" },
    },
    buddy: { face: "#FFF6EC", ink: "#221F2E", blush: "#FF7E9D" },
    shadow: "0 1px 2px rgb(26 25 23 / .04), 0 8px 24px rgb(26 25 23 / .08)",
    shadowThumb: "0 1px 3px rgb(0 0 0 / .1)",
  },
  dark: {
    neutral: {
      bg: "#000000",
      surface: "#111111",
      "surface-2": "#1A1A1A",
      line: "#1F1F1F",
      border: "#2E2E2E",
      muted: "#8B8B88",
      "text-2": "#A9A9A5",
      text: "#F2F1EE",
    },
    brand: {
      brand: "#8B5CFF",
      "brand-tint": "#2A1E4A",
      "brand-hover": "#9D75FF",
      "on-brand": "#FFFFFF",
    },
    tints: {
      violet: { bg: "#2A1E4A", fg: "#B98CFF" },
      blue: { bg: "#12284A", fg: "#5AA9FF" },
      orange: { bg: "#3D2606", fg: "#FFA640" },
      red: { bg: "#3F1A22", fg: "#FF7A8F" },
      green: { bg: "#0F3328", fg: "#3FD9A8" },
      pink: { bg: "#3E1A3A", fg: "#F07AE6" },
      amber: { bg: "#3B2F05", fg: "#F2C200" },
      cyan: { bg: "#0F3038", fg: "#3FD3EE" },
      indigo: { bg: "#1B2049", fg: "#8A93FF" },
    },
    buddy: { face: "#F6EBDD", ink: "#221F2E", blush: "#FF7E9D" },
    shadow: "0 1px 2px rgb(0 0 0 / .4), 0 8px 24px rgb(0 0 0 / .5)",
    shadowThumb: "0 1px 3px rgb(0 0 0 / .4)",
  },
} as const satisfies Record<ThemeName, ThemePalette>;

export interface TypeStyle {
  readonly size: number;
  readonly lineHeight: number;
  readonly tracking: number;
  readonly weight: 400 | 500 | 600;
}

export const typeScale = {
  display: { size: 44, lineHeight: 48, tracking: -0.025, weight: 600 },
  heading: { size: 28, lineHeight: 34, tracking: -0.02, weight: 600 },
  title: { size: 20, lineHeight: 28, tracking: -0.015, weight: 600 },
  lead: { size: 17, lineHeight: 26, tracking: 0, weight: 400 },
  body: { size: 15, lineHeight: 22, tracking: 0, weight: 400 },
  small: { size: 14, lineHeight: 20, tracking: 0, weight: 400 },
  footnote: { size: 13, lineHeight: 18, tracking: 0, weight: 400 },
  caption: { size: 12, lineHeight: 16, tracking: 0, weight: 600 },
} as const satisfies Record<string, TypeStyle>;
export type TypeScaleKey = keyof typeof typeScale;

export const fontFeatures = ['"cv11"', '"ss01"', '"tnum"'] as const;

export const spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export const radii = {
  xs: 6,
  sm: 8,
  control: 10,
  tile: 14,
  card: 20,
} as const satisfies Record<string, number>;
export type RadiusKey = keyof typeof radii;

export const durations = {
  fast: 150,
  base: 220,
  slow: 300,
} as const satisfies Record<string, number>;
export type DurationKey = keyof typeof durations;

export const easings = {
  standard: "cubic-bezier(.2,.8,.2,1)",
  spring: "cubic-bezier(.3,1.5,.5,1)",
} as const satisfies Record<string, string>;
export type EasingKey = keyof typeof easings;

export const layout = {
  app: 640,
  landing: 1120,
  mobileGutter: 20,
  minHitTarget: 44,
} as const;

export const iconography = {
  strokeWidth: 1.8,
  inline: 20,
  nav: 24,
} as const;
