import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type BreakdownRowProps = {
  name: string;
  share: string;
  amount: string;
  last?: boolean;
};

export function BreakdownRow({
  name,
  share,
  amount,
  last = false,
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
