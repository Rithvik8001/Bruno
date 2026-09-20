import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type PlanRowProps = {
  name: string;
  price: string;
  note?: string;
  selected: boolean;
  onSelect: () => void;
  last?: boolean;
};

export function PlanRow({
  name,
  price,
  note,
  selected,
  onSelect,
  last = false,
}: PlanRowProps) {
  const theme = useTheme();

  return (
    <Tappable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={
        note === undefined ? `${name}, ${price}` : `${name}, ${note}, ${price}`
      }
      style={{
        height: layout.rowXL,
        flexDirection: "row",
        alignItems: "center",
        gap: layout.plan.gap,
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <View
        style={{
          width: layout.radio.size,
          height: layout.radio.size,
          borderRadius: layout.radio.size / 2,
          borderWidth: selected
            ? layout.radio.selectedRing
            : layout.radio.idleStroke,
          borderColor: selected ? theme.accent : theme.ink3,
        }}
      />
      <View style={{ flex: 1, gap: layout.plan.subGap }}>
        <T style="row" numberOfLines={1}>
          {name}
        </T>
        {note === undefined ? null : (
          <T style="caption" color="ink3" numberOfLines={1}>
            {note}
          </T>
        )}
      </View>
      <T style="row">{price}</T>
    </Tappable>
  );
}
