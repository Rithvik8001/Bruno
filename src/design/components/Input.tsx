import { useState, type Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useTypeStyle } from "../typography";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type InputSuffix = {
  title: string;
  onPress: () => void;
};

export type InputProps = Omit<TextInputProps, "style" | "allowFontScaling"> & {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: InputSuffix;
  mono?: boolean;
  ref?: Ref<TextInput>;
};

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  mono = false,
  ref,
  onFocus,
  onBlur,
  multiline = false,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const typeStyle = useTypeStyle(mono ? "numLarge" : "body");
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;
  const hasError = error !== undefined;

  return (
    <View>
      {label === undefined ? null : (
        <>
          <T style="label" color="ink3" numberOfLines={1}>
            {label}
          </T>
          <Spacer height={layout.input.labelGap} />
        </>
      )}
      <View
        style={{
          minHeight: multiline ? layout.input.multilineMinHeight : layout.input.height,
          borderRadius: radius.control,
          backgroundColor: theme.surface,
          borderWidth: layout.hairline,
          borderColor: hasError ? theme.ink : focused ? theme.border2 : theme.border,
          paddingHorizontal: layout.input.paddingHorizontal,
          paddingVertical: multiline ? layout.input.multilinePaddingVertical : 0,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
        }}
      >
        {prefix === undefined ? null : (
          <T
            style="numLarge"
            color="ink3"
            override={{ marginRight: layout.input.prefixGap }}
          >
            {prefix}
          </T>
        )}
        <TextInput
          ref={ref}
          allowFontScaling={false}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={theme.ink4}
          selectionColor={theme.ink}
          multiline={multiline}
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
              textAlignVertical: multiline ? "top" : "center",
            },
          ]}
          {...rest}
        />
        {suffix === undefined ? null : (
          <Tappable
            onPress={suffix.onPress}
            accessibilityRole="button"
            accessibilityLabel={suffix.title}
            hitSlop={layout.input.paddingHorizontal}
            style={{ marginLeft: layout.input.suffixGap }}
          >
            <T style="caption" color="ink3">
              {suffix.title}
            </T>
          </Tappable>
        )}
      </View>
      {note === undefined ? null : (
        <>
          <Spacer height={layout.input.hintGap} />
          <T style="caption" color={hasError ? "ink2" : "ink3"}>
            {note}
          </T>
        </>
      )}
    </View>
  );
}
