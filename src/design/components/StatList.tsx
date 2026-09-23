import { View } from "react-native";

import { layout } from "../tokens";
import { Hairline } from "../primitives/Hairline";
import { T } from "../primitives/T";

export type StatItem = {
  key: string;
  label: string;
  value: string;
  note?: string;
};

export type StatListProps = {
  items: readonly StatItem[];
};

export function StatList({ items }: StatListProps) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.key}>
          {index === 0 ? null : <Hairline />}
          <View
            accessible
            accessibilityLabel={[item.label, item.value, item.note]
              .filter((part) => part !== undefined)
              .join(", ")}
            style={{
              minHeight: layout.stat.rowHeight,
              flexDirection: "row",
              alignItems: "center",
              gap: layout.row.gap,
            }}
          >
            <T style="body" color="ink2" numberOfLines={1} override={{ flex: 1 }}>
              {item.label}
            </T>
            <View style={{ alignItems: "flex-end" }}>
              <T style="num" numberOfLines={1}>
                {item.value}
              </T>
              {item.note === undefined ? null : (
                <T style="caption" color="ink3" numberOfLines={1}>
                  {item.note}
                </T>
              )}
            </View>
          </View>
        </View>
      ))}
      <Hairline />
    </View>
  );
}
