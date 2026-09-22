import { View } from "react-native";

import { layout } from "../tokens";
import type { TypeToken } from "../types";
import { T } from "../primitives/T";

export type MoneySize = "display" | "title";

export type MoneyProps = {
  amount: string;
  caption?: string;
  size?: MoneySize;
};

const sizeToken: Record<MoneySize, TypeToken> = {
  display: "display",
  title: "title",
};

export function Money({ amount, caption, size = "display" }: MoneyProps) {
  const figure = (
    <T
      style={sizeToken[size]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={layout.money.minimumScale}
      override={{ flexShrink: 1 }}
    >
      {amount}
    </T>
  );

  if (caption === undefined) {
    return figure;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: layout.money.captionGap,
      }}
    >
      {figure}
      <T style="caption" color="ink3">
        {caption}
      </T>
    </View>
  );
}
