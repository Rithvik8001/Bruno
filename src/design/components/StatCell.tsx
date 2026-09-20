import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Label } from "./Label";

export type StatCellProps = {
  value: string;
  label: string;
};

export function StatCell({ value, label }: StatCellProps) {
  return (
    <View style={{ flex: 1, gap: layout.stat.valueGap }}>
      <T style="stat" numberOfLines={1}>
        {value}
      </T>
      <Label>{label}</Label>
    </View>
  );
}

export type StatRowProps = {
  cells: readonly StatCellProps[];
};

export function StatRow({ cells }: StatRowProps) {
  return (
    <View style={{ flexDirection: "row", gap: layout.stat.gap }}>
      {cells.map((cell) => (
        <StatCell key={cell.label} value={cell.value} label={cell.label} />
      ))}
    </View>
  );
}
