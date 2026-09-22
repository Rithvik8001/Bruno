import { Host, HStack, Image, Menu, Picker, Spacer, Text } from "@expo/ui/swift-ui";
import {
  contentShape,
  font,
  foregroundStyle,
  pickerStyle,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { icons, layout, type } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { Hairline } from "../primitives/Hairline";
import { T } from "../primitives/T";

export type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type SelectFieldProps<TValue extends string> = {
  label: string;
  options: readonly SelectOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  placeholder?: boolean;
  last?: boolean;
};

export function SelectField<TValue extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = false,
  last = false,
}: SelectFieldProps<TValue>) {
  const theme = useTheme();
  const themeName = useThemeName();
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <View
        style={{
          minHeight: layout.row.minHeight,
          paddingHorizontal: layout.row.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <T style="bodyMedium" numberOfLines={1}>
          {label}
        </T>
        <Host
          matchContents={{ vertical: true }}
          colorScheme={themeName}
          seedColor={theme.ink}
          style={{ flex: 1, minHeight: layout.row.minHeight, justifyContent: "center" }}
        >
          <Menu
            label={
              <HStack
                alignment="center"
                spacing={layout.select.gap}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Spacer />
                <Text
                  modifiers={[
                    font({ size: type.body.fontSize }),
                    foregroundStyle(placeholder ? theme.ink4 : theme.ink2),
                  ]}
                >
                  {selected?.label ?? ""}
                </Text>
                <Image
                  systemName={icons.select}
                  size={layout.select.chevron}
                  color={theme.ink4}
                />
              </HStack>
            }
          >
            <Picker<TValue>
              selection={value}
              onSelectionChange={onChange}
              modifiers={[pickerStyle("inline")]}
            >
              {options.map((option) => (
                <Text key={option.value} modifiers={[tag(option.value)]}>
                  {option.label}
                </Text>
              ))}
            </Picker>
          </Menu>
        </Host>
      </View>
      {last ? null : <Hairline />}
    </>
  );
}
