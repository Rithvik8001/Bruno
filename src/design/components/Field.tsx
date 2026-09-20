import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useTypeStyle } from "../typography";
import { Gap } from "../primitives/Gap";
import { Label } from "./Label";

export type FieldSize = "field" | "input";

export type FieldProps = Omit<TextInputProps, "style" | "allowFontScaling"> & {
  label: string;
  size?: FieldSize;
};

export function Field({ label, size = "input", onFocus, onBlur, ...rest }: FieldProps) {
  const theme = useTheme();
  const typeStyle = useTypeStyle(size);
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Label>{label}</Label>
      <Gap size="s8" />
      <TextInput
        allowFontScaling={false}
        accessibilityLabel={label}
        placeholderTextColor={theme.ink3}
        selectionColor={theme.accent}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          typeStyle,
          {
            color: theme.ink,
            paddingTop: layout.field.paddingTop,
            paddingBottom: layout.field.paddingBottom,
            borderBottomWidth: layout.hairline,
            borderBottomColor: focused ? theme.accent : theme.hair,
          },
        ]}
        {...rest}
      />
    </View>
  );
}
