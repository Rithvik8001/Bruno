import type { SFSymbol } from "sf-symbols-typescript";

import type { Theme, ThemeName } from "./types";

export const themes = {
  light: {
    paper: "#FBFAF7",
    ink: "#1A1917",
    ink2: "#5F5D58",
    ink3: "#75736E",
    hair: "#E8E6E1",
    accent: "#6E56CF",
    onInk: "#FBFAF7",
    glass: "rgba(251,250,247,0.66)",
    glassBorder: "rgba(26,25,23,0.08)",
    glassPill: "rgba(26,25,23,0.07)",
    glassShadow: { color: "#1A1917", opacity: 0.1, radius: 30, offsetY: 10 },
    chart: ["#1E9A86", "#E0742A", "#3A6FE0", "#93A81C", "#DA4F84", "#D6A20E"],
    chartBar: "#A7B2AD",
  },
  dark: {
    paper: "#0F0F0E",
    ink: "#EDEBE6",
    ink2: "#A8A6A0",
    ink3: "#85837D",
    hair: "#262624",
    accent: "#A28BF5",
    onInk: "#0F0F0E",
    glass: "rgba(28,28,26,0.62)",
    glassBorder: "rgba(237,235,230,0.10)",
    glassPill: "rgba(237,235,230,0.10)",
    glassShadow: { color: "#000000", opacity: 0.45, radius: 30, offsetY: 10 },
    chart: ["#35A894", "#D97634", "#5486DA", "#88961F", "#D6648C", "#B88A16"],
    chartBar: "#4E5C58",
  },
} as const satisfies Record<ThemeName, Theme>;

export const fonts = {
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemibold: "HankenGrotesk_600SemiBold",
} as const;

export const type = {
  moneyXL: {
    fontFamily: fonts.sansMedium,
    fontSize: 76,
    lineHeight: 84,
    letterSpacing: -2.5,
  },
  moneyL: {
    fontFamily: fonts.sansMedium,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
  },
  moneyM: {
    fontFamily: fonts.sansMedium,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.8,
  },
  moneyS: {
    fontFamily: fonts.sansMedium,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  statement: {
    fontFamily: fonts.sansMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
  },
  amount: {
    fontFamily: fonts.sansMedium,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: fonts.sansSemibold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  digit: {
    fontFamily: fonts.sansMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  wordmark: {
    fontFamily: fonts.sansSemibold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
  },

  input: {
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  field: {
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  stat: {
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  row: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  filter: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  labelValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  tab: {
    fontFamily: fonts.sansSemibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.1,
  },
} as const;

export const displayTypeTokens = [
  "moneyXL",
  "moneyL",
  "moneyM",
  "moneyS",
  "statement",
  "amount",
  "title",
  "digit",
  "wordmark",
] as const;

export const space = {
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s36: 36,
  s40: 40,
  s44: 44,
  s48: 48,
  s56: 56,
} as const;

export const layout = {
  margin: 24,
  top: 64,
  bottom: 28,
  dateColumn: 64,
  hairline: 1,
  hit: 44,
  row: 52,
  rowDense: 50,
  rowTall: 56,
  rowXL: 64,
  pill: { height: 52, radius: 26 },
  link: { height: 48 },
  toggle: { width: 42, height: 26, radius: 13, knob: 20, knobInset: 3 },
  radio: { size: 16, selectedRing: 5, idleStroke: 1.5 },
  field: {
    labelGap: 8,
    paddingTop: 18,
    paddingBottom: 16,
    trailingGap: 12,
    noteGap: 10,
  },
  auth: { navGap: 44, forgotGap: 18 },
  disclosure: { height: 32, gap: 6 },
  nativeAlert: { host: 1 },
  codeSlot: {
    height: 56,
    gap: 10,
    paddingBottom: 8,
    caretWidth: 1.5,
    caretHeight: 30,
    count: 6,
  },
  ledger: { noteGap: 2, datePadding: 8, rowInset: 14 },
  onboarding: { lede: 236 },
  plan: { gap: 14, subGap: 2 },
  stat: { gap: 16, valueGap: 6 },
  filterTabs: { gap: 24, height: 24 },
  settingsRow: { chevronGap: 10, chevron: 16 },
  sectionHeader: { captionHitSlop: 12, gap: 6, tightGap: 4 },
  list: { captionGap: 10 },
  breakdown: { height: 44, column: 72 },
  hero: { captionGap: 10, lineGap: 10 },
  chart: {
    donutHeight: 200,
    donutInner: 0.7,
    angularInset: 1.5,
    centerWidth: 150,
    barHeight: 168,
    barCorner: 3,
    barWidth: 14,
    barLabelGap: 8,
    swatch: 8,
    swatchGap: 10,
    ruleWidth: 1,
    ruleDash: [3, 4],
  },
  navRow: { height: 44, actionPadding: 16 },
  tabBar: { height: 62, bottom: 26 },
} as const;

export const icons = {
  tabOverview: "house",
  tabSubscriptions: "creditcard",
  tabInsights: "chart.line.uptrend.xyaxis",
  tabSettings: "gearshape",
  back: "chevron.left",
  add: "plus",
  close: "xmark",
  chevron: "chevron.right",
  disclose: "chevron.down",
  collapse: "chevron.up",
  tick: "checkmark",
} as const satisfies Record<string, SFSymbol>;

export const iconSizes = { bar: 22, inline: 16, tight: 14 } as const;

export const symbolWeight = "regular" as const;
