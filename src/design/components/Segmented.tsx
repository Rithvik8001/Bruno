import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";

export type SegmentOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type SegmentedProps<TValue extends string> = {
  options: readonly SegmentOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function Segmented<TValue extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<TValue>) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <View accessibilityRole="tablist" style={{ minHeight: layout.tabs.height }}>
      <Host
        colorScheme={themeName}
        seedColor={theme.ink}
        style={{ alignSelf: "stretch", height: layout.tabs.height }}
      >
        <Picker<TValue>
          selection={value}
          onSelectionChange={onChange}
          modifiers={[pickerStyle("segmented")]}
        >
          {options.map((option) => (
            <Text key={option.value} modifiers={[tag(option.value)]}>
              {option.label}
            </Text>
          ))}
        </Picker>
      </Host>
    </View>
  );
}
