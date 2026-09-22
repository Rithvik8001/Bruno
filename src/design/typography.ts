import { useWindowDimensions } from "react-native";

import { displayTypeTokens, type } from "./tokens";
import type { ResolvedTextStyle, TypeToken } from "./types";

const displayTokens: ReadonlySet<TypeToken> = new Set(displayTypeTokens);

export const dynamicTypeRange = {
  display: { min: 0.85, max: 1.3 },
  text: { min: 0.85, max: 1.6 },
} as const;

export const numericVariant = ["lining-nums", "tabular-nums"] as const;

export const heroMinimumFontScale = 0.7;
export const ledgerDateMinimumFontScale = 0.75;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isDisplay(token: TypeToken): boolean {
  return displayTokens.has(token);
}

export function scaleTypeStyle(
  token: TypeToken,
  fontScale: number,
): ResolvedTextStyle {
  const base = type[token];
  const range = isDisplay(token)
    ? dynamicTypeRange.display
    : dynamicTypeRange.text;
  const scale = clamp(fontScale, range.min, range.max);

  return {
    ...base,
    fontSize: round(base.fontSize * scale),
    lineHeight: round(base.lineHeight * scale),
    fontVariant: [...numericVariant],
  };
}

export function useTypeStyle(token: TypeToken): ResolvedTextStyle {
  const { fontScale } = useWindowDimensions();
  return scaleTypeStyle(token, fontScale);
}

export function useFontScale(): number {
  return useWindowDimensions().fontScale;
}
