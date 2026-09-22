import { useState, type Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useTypeStyle } from "../typography";
import { Gap } from "../primitives/Gap";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";
import { Label } from "./Label";

export type FieldSize = "amount" | "field" | "input";

export type FieldTrailing = {
  title: string;
  onPress: () => void;
};

export type FieldProps = Omit<TextInputProps, "style" | "allowFontScaling"> & {
  label: string;
  size?: FieldSize;
  prefix?: string;
  hint?: string;
  error?: string;
  trailing?: FieldTrailing;
  ref?: Ref<TextInput>;
};

export function Field({
  label,
  size = "input",
  prefix,
  hint,
  error,
  trailing,
  ref,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const theme = useTheme();
  const typeStyle = useTypeStyle(size);
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;
  const empty = typeof rest.value === "string" && rest.value.length === 0;

  return (
    <View>
      <View
        style={{
          paddingTop: layout.field.paddingTop,
          paddingBottom: layout.field.paddingBottom,
          borderBottomWidth: layout.hairline,
          borderBottomColor: focused ? theme.accent : theme.hair,
        }}
      >
        <Label>{label}</Label>
        <Gap size="s8" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          {prefix === undefined ? null : (
            <T
              style={size}
              color={empty ? "ink3" : "ink"}
              override={{ letterSpacing: 0 }}
            >
              {prefix}
            </T>
          )}
          <TextInput
            ref={ref}
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
                flex: 1,
                minWidth: 0,
                padding: 0,
                color: theme.ink,
              },
            ]}
            {...rest}
          />
          {trailing === undefined ? null : (
            <Tappable
              onPress={trailing.onPress}
              accessibilityRole="button"
              accessibilityLabel={trailing.title}
              style={{
                justifyContent: "flex-end",
                marginLeft: layout.field.trailingGap,
              }}
            >
              <T style="filter" color="ink3">
                {trailing.title}
              </T>
            </Tappable>
          )}
        </View>
      </View>
      {note === undefined ? null : (
        <>
          <Spacer height={layout.field.noteGap} />
          <T style="caption" color={error === undefined ? "ink3" : "ink2"}>
            {note}
          </T>
        </>
      )}
    </View>
  );
}
