import { ScrollView, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type TabOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type TabsProps<TValue extends string> = {
  options: readonly TabOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function Tabs<TValue extends string>({
  options,
  value,
  onChange,
}: TabsProps<TValue>) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderBottomWidth: layout.hairline,
        borderBottomColor: theme.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: layout.tabs.gap }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Tappable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              style={{
                height: layout.tabs.height,
                justifyContent: "center",
                marginBottom: -layout.hairline,
                borderBottomWidth: layout.tabs.indicator,
                borderBottomColor: active ? theme.ink : "transparent",
              }}
            >
              <T style="bodyMedium" color={active ? "ink" : "ink3"} numberOfLines={1}>
                {option.label}
              </T>
            </Tappable>
          );
        })}
      </ScrollView>
    </View>
  );
}
