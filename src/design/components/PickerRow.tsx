import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { useTheme, useThemeName } from "../theme/useTheme";

export type PickerOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type PickerRowProps<TValue extends string> = {
  label: string;
  options: readonly PickerOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  last?: boolean;
};

export function PickerRow<TValue extends string>({
  label,
  options,
  value,
  onChange,
  last = false,
}: PickerRowProps<TValue>) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <View
      style={{
        minHeight: layout.row,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <T style="row" override={{ flex: 1 }} numberOfLines={1}>
        {label}
      </T>
      <Host matchContents colorScheme={themeName} seedColor={theme.ink}>
        <Picker<TValue>
          label={label}
          selection={value}
          onSelectionChange={onChange}
          modifiers={[pickerStyle("menu"), tint(theme.ink)]}
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
