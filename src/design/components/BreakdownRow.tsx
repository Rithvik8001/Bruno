import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type BreakdownRowProps = {
  name: string;
  share: string;
  amount: string;
  last?: boolean;
  swatch?: string;
};

export function BreakdownRow({
  name,
  share,
  amount,
  last = false,
  swatch,
}: BreakdownRowProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        height: layout.breakdown.height,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      {swatch === undefined ? null : (
        <View
          style={{
            width: layout.chart.swatch,
            height: layout.chart.swatch,
            borderRadius: layout.chart.swatch / 2,
            backgroundColor: swatch,
            marginRight: layout.chart.swatchGap,
          }}
        />
      )}
      <T style="filter" override={{ flex: 1 }} numberOfLines={1}>
        {name}
      </T>
      <T
        style="caption"
        color="ink3"
        align="right"
        override={{ width: layout.breakdown.column }}
      >
        {share}
      </T>
      <T
        style="filter"
        align="right"
        override={{ width: layout.breakdown.column }}
      >
        {amount}
      </T>
    </View>
  );
}
