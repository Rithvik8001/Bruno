import { font, kerning, type ModifierConfig } from "@expo/ui/swift-ui/modifiers";

import { fonts, weights } from "./tokens";
import type { TypeToken } from "./types";
import { scaleTypeStyle, useFontScale } from "./typography";

export const swiftWeight = {
  [weights.regular]: "regular",
  [weights.medium]: "medium",
  [weights.semibold]: "semibold",
  [weights.bold]: "bold",
  [weights.heavy]: "heavy",
} as const;

type SwiftWeight = (typeof swiftWeight)[keyof typeof swiftWeight];

function toSwiftWeight(weight: unknown): SwiftWeight {
  return typeof weight === "string" && weight in swiftWeight
    ? swiftWeight[weight as keyof typeof swiftWeight]
    : "regular";
}

export function swiftFont(token: TypeToken, fontScale: number): ModifierConfig[] {
  const style = scaleTypeStyle(token, fontScale);
  const family = style.fontFamily === fonts.sans ? undefined : style.fontFamily;
  const modifiers: ModifierConfig[] = [
    font({
      family,
      size: style.fontSize,
      weight: family === undefined ? toSwiftWeight(style.fontWeight) : undefined,
    }),
  ];
  if (style.letterSpacing !== undefined && style.letterSpacing !== 0) {
    modifiers.push(kerning(style.letterSpacing));
  }
  return modifiers;
}

export function useSwiftFont(token: TypeToken): ModifierConfig[] {
  return swiftFont(token, useFontScale());
}
