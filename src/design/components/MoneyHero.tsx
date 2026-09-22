import { View } from "react-native";

import { layout } from "../tokens";
import { heroMinimumFontScale } from "../typography";
import type { TypeToken } from "../types";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type MoneyHeroSize = "xl" | "l" | "m" | "s";

export type MoneyHeroProps = {
  amount: string;
  caption?: string;
  size?: MoneyHeroSize;
  inline?: boolean;
};

const sizeToken: Record<MoneyHeroSize, TypeToken> = {
  xl: "moneyXL",
  l: "moneyL",
  m: "moneyM",
  s: "moneyS",
};

export function MoneyHero({
  amount,
  caption,
  size = "xl",
  inline = false,
}: MoneyHeroProps) {
  const money = (
    <T
      style={sizeToken[size]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={heroMinimumFontScale}
      override={inline ? { flexShrink: 1 } : undefined}
    >
      {amount}
    </T>
  );

  if (caption === undefined) {
    return money;
  }

  if (inline) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: layout.hero.captionGap,
        }}
      >
        {money}
        <T style="caption" color="ink2">
          {caption}
        </T>
      </View>
    );
  }

  return (
    <>
      {money}
      <Spacer height={layout.hero.lineGap} />
      <T style="body" color="ink2">
        {caption}
      </T>
    </>
  );
}
