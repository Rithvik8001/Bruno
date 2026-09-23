import { Host, HStack, Image, Menu, Picker, Text } from "@expo/ui/swift-ui";
import {
  contentShape,
  foregroundStyle,
  pickerStyle,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";

import { icons, layout } from "../tokens";
import { useSwiftFont } from "../swiftText";
import { useTheme, useThemeName } from "../theme/useTheme";
import type { IconSource } from "../types";
import { IconRow } from "./IconRow";

export type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type SelectFieldProps<TValue extends string> = {
  label: string;
  options: readonly SelectOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  icon?: IconSource;
  placeholder?: boolean;
};

export function SelectField<TValue extends string>({
  label,
  options,
  value,
  onChange,
  icon,
  placeholder = false,
}: SelectFieldProps<TValue>) {
  const theme = useTheme();
  const themeName = useThemeName();
  const valueFont = useSwiftFont("body");
  const selected = options.find((option) => option.value === value);

  return (
    <IconRow
      icon={icon}
      title={label}
      trailing={
        <Host
          matchContents={{ horizontal: true }}
          colorScheme={themeName}
          seedColor={theme.ink}
          style={{ height: layout.row.minHeight - layout.row.paddingVertical * 2 }}
        >
          <Menu
            label={
              <HStack
                alignment="center"
                spacing={layout.select.gap}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Text
                  modifiers={[
                    ...valueFont,
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
      }
    />
  );
}
