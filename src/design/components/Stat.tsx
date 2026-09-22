import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type StatProps = {
  value: string;
  label: string;
};

export function Stat({ value, label }: StatProps) {
  return (
    <View style={{ flex: 1 }}>
      <T style="numLarge" numberOfLines={1}>
        {value}
      </T>
      <Spacer height={layout.stat.valueGap} />
      <T style="label" color="ink3" numberOfLines={1}>
        {label}
      </T>
    </View>
  );
}

export type StatRowProps = {
  cells: readonly StatProps[];
};

export function StatRow({ cells }: StatRowProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: layout.stat.gap }}>
      {cells.map((cell, index) => (
        <View key={cell.label} style={{ flex: 1, flexDirection: "row", gap: layout.stat.gap }}>
          {index === 0 ? null : (
            <View
              style={{
                width: layout.stat.rule,
                backgroundColor: theme.border,
              }}
            />
          )}
          <Stat value={cell.value} label={cell.label} />
        </View>
      ))}
    </View>
  );
}
