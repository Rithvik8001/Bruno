import type { SFSymbol } from "sf-symbols-typescript";

import type { Theme, ThemeName } from "./types";

export const themes = {
  light: {
    canvas: "#FFFFFF",
    surface: "#FAFAFA",
    surface2: "#F2F2F2",
    border: "#EBEBEB",
    border2: "#D4D4D4",
    ink: "#171717",
    ink2: "#4D4D4D",
    ink3: "#666666",
    ink4: "#A3A3A3",
    onInk: "#FFFFFF",
    bar: "#171717",
    barMuted: "#D4D4D4",
  },
  dark: {
    canvas: "#000000",
    surface: "#0A0A0A",
    surface2: "#141414",
    border: "#262626",
    border2: "#3A3A3A",
    ink: "#EDEDED",
    ink2: "#A1A1A1",
    ink3: "#8F8F8F",
    ink4: "#5C5C5C",
    onInk: "#000000",
    bar: "#EDEDED",
    barMuted: "#3A3A3A",
  },
} as const satisfies Record<ThemeName, Theme>;

export const fonts = {
  sans: "System",
  serif: "Newsreader_400Regular",
  serifMedium: "Newsreader_500Medium",
} as const;

export const weights = {
  regular: "400",
  medium: "500",
  semibold: "600",
} as const;

export const type = {
  statement: {
    fontFamily: fonts.serif,
    fontWeight: weights.regular,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  display: {
    fontFamily: fonts.serif,
    fontWeight: weights.regular,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fonts.serif,
    fontWeight: weights.regular,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fonts.serif,
    fontWeight: weights.regular,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.sans,
    fontWeight: weights.regular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fonts.sans,
    fontWeight: weights.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fonts.sans,
    fontWeight: weights.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.sans,
    fontWeight: weights.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  num: {
    fontFamily: fonts.sans,
    fontWeight: weights.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  numLarge: {
    fontFamily: fonts.sans,
    fontWeight: weights.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  code: {
    fontFamily: fonts.sans,
    fontWeight: weights.medium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1,
  },
} as const;

export const displayTypeTokens = [
  "statement",
  "display",
  "title",
  "heading",
  "code",
] as const;

export const space = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s64: 64,
} as const;

export const radius = {
  compact: 4,
  control: 22,
  container: 22,
  full: 999,
} as const;

export const layout = {
  margin: 20,
  top: 64,
  topInset: 16,
  bottom: 24,
  hairline: 1,
  hit: 44,
  nav: { height: 44, side: 12, symbol: 22 },
  button: { height: 44, heightSmall: 36, paddingHorizontal: 16, fillWidth: 10000 },
  input: {
    height: 44,
    paddingHorizontal: 16,
    labelGap: 6,
    hintGap: 6,
    prefixGap: 6,
    suffixGap: 12,
    multilinePaddingVertical: 11,
    multilineLines: { min: 3 },
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    subGap: 2,
    chevron: 14,
    chevronGap: 8,
  },
  code: { cell: 44, gap: 8, underline: 2, caretWidth: 2, caretHeight: 24 },
  tabs: { height: 36, indicator: 1, gap: 20 },
  stat: { gap: 12, valueGap: 4, rule: 1 },
  bar: {
    height: 6,
    trackRadius: 3,
    gap: 8,
    rowHeight: 44,
    rowGap: 6,
    chartHeight: 140,
    labelGap: 8,
    corner: 2,
    width: 12,
    ruleWidth: 1,
    ruleDash: [3, 4],
    column: 56,
  },
  onboarding: { statementTop: 96 },
  tabBar: { height: 62, bottom: 26 },
  emptyState: { gap: 8, actionGap: 20 },
  toggle: { width: 44, height: 24, radius: 12, knob: 20, inset: 1 },
  money: { captionGap: 8, minimumScale: 0.7 },
  disclosure: { height: 32, gap: 6 },
  loading: { bar: 12, long: 0.6, short: 0.35, rows: 4, gap: 8 },
  link: { height: 44 },
  select: { chevron: 12, gap: 6 },
  nativeAlert: { host: 1 },
} as const;

export const motion = {
  duration: { fade: 120 },
  pressedOpacity: 0.6,
} as const;

export const icons = {
  tabOverview: "house",
  tabSubscriptions: "creditcard",
  tabInsights: "chart.bar",
  tabSettings: "gearshape",
  back: "chevron.left",
  close: "xmark",
  add: "plus",
  chevron: "chevron.right",
  select: "chevron.up.chevron.down",
  disclose: "chevron.down",
  collapse: "chevron.up",
} as const satisfies Record<string, SFSymbol>;

export const iconSizes = { bar: 22, inline: 16, tight: 14 } as const;

export const symbolWeight = "regular" as const;
