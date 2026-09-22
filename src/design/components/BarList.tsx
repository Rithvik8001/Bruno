import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type BarListItem = {
  key: string;
  label: string;
  share: number;
  amount: string;
  percent: string;
};

export type BarListProps = {
  items: readonly BarListItem[];
};

export function BarList({ items }: BarListProps) {
  const theme = useTheme();

  return (
    <View>
      {items.map((item) => (
        <View
          key={item.key}
          style={{ minHeight: layout.bar.rowHeight, justifyContent: "center" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <T style="bodyMedium" numberOfLines={1} override={{ flex: 1 }}>
              {item.label}
            </T>
            <T
              style="num"
              color="ink3"
              align="right"
              override={{ width: layout.bar.column }}
            >
              {item.percent}
            </T>
            <T style="num" align="right" override={{ minWidth: layout.bar.column }}>
              {item.amount}
            </T>
          </View>
          <View
            style={{
              marginTop: layout.bar.rowGap,
              height: layout.bar.height,
              borderRadius: layout.bar.trackRadius,
              backgroundColor: theme.surface2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.max(0, Math.min(1, item.share)) * 100}%`,
                height: layout.bar.height,
                backgroundColor: theme.bar,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
