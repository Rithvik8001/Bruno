import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type FilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type FilterTabsProps<TValue extends string> = {
  options: readonly FilterOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function FilterTabs<TValue extends string>({
  options,
  value,
  onChange,
}: FilterTabsProps<TValue>) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: layout.filterTabs.gap }}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Tappable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={{
              height: layout.filterTabs.height,
              justifyContent: "flex-start",
              borderBottomWidth: layout.hairline,
              borderBottomColor: active ? theme.ink : "transparent",
            }}
          >
            <T style="filter" color={active ? "ink" : "ink3"}>
              {option.label}
            </T>
          </Tappable>
        );
      })}
    </View>
  );
}
