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
  },
} as const satisfies Record<ThemeName, Theme>;

export const fonts = {
  regular: "400",
  medium: "500",
  semibold: "600",
} as const;

export const type = {
  moneyXL: {
    fontWeight: fonts.medium,
    fontSize: 76,
    lineHeight: 88,
    letterSpacing: -2.5,
  },
  moneyL: {
    fontWeight: fonts.medium,
    fontSize: 64,
    lineHeight: 74,
    letterSpacing: -2,
  },
  moneyM: {
    fontWeight: fonts.medium,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.8,
  },
  statement: {
    fontWeight: fonts.medium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  amount: {
    fontWeight: fonts.medium,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
  },
  title: {
    fontWeight: fonts.medium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
  },
  digit: {
    fontWeight: fonts.medium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  wordmark: {
    fontWeight: fonts.semibold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
  },

  input: {
    fontWeight: fonts.medium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  field: {
    fontWeight: fonts.medium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  stat: {
    fontWeight: fonts.medium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  row: {
    fontWeight: fonts.medium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
  },
  button: {
    fontWeight: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  body: {
    fontWeight: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  filter: {
    fontWeight: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontWeight: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  sub: {
    fontWeight: fonts.regular,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0,
  },
  label: {
    fontWeight: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  tab: {
    fontWeight: fonts.semibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.1,
  },
} as const;

export const displayTypeTokens = [
  "moneyXL",
  "moneyL",
  "moneyM",
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
