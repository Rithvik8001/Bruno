import { useWindowDimensions } from "react-native";

import { fonts, type } from "./tokens";
import type { ResolvedTextStyle, TypeToken } from "./types";

const serifFamilies: readonly string[] = [fonts.serif, fonts.serifItalic];

export const dynamicTypeRange = {
  serif: { min: 0.85, max: 1.3 },
  sans: { min: 0.85, max: 1.6 },
} as const;

export const numericVariant = ["lining-nums", "tabular-nums"] as const;

export const heroMinimumFontScale = 0.7;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isSerif(token: TypeToken): boolean {
  return serifFamilies.includes(type[token].fontFamily);
}

export function scaleTypeStyle(token: TypeToken, fontScale: number): ResolvedTextStyle {
  const base = type[token];
  const range = isSerif(token) ? dynamicTypeRange.serif : dynamicTypeRange.sans;
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
