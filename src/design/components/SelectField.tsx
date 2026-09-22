import {
  Host,
  HStack,
  Image,
  Menu,
  Picker,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  contentShape,
  font,
  foregroundStyle,
  pickerStyle,
  shapes,
  tag,
} from "@expo/ui/swift-ui/modifiers";

import { iconSizes, icons, type } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { FieldShell } from "./FieldShell";

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
    <FieldShell label={label} last={last}>
      <Host
        matchContents={{ vertical: true }}
        colorScheme={themeName}
        seedColor={theme.accent}
        style={{ alignSelf: "stretch" }}
      >
        <Menu
          label={
            <HStack
              alignment="center"
              modifiers={[contentShape(shapes.rectangle())]}
            >
              <Text
                modifiers={[
                  font({ size: type.field.fontSize, weight: "medium" }),
                  foregroundStyle(placeholder ? theme.ink3 : theme.ink),
                ]}
              >
                {selected?.label ?? ""}
              </Text>
              <Spacer />
              <Image
                systemName={icons.disclose}
                size={iconSizes.inline}
                color={theme.ink3}
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
    </FieldShell>
  );
}
