import {
  Button as SwiftButton,
  HStack,
  Host,
  SecureField,
  Text,
  TextField,
  useNativeState,
  type SecureFieldRef,
  type TextFieldRef,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  background,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  keyboardType as keyboardTypeModifier,
  lineLimit,
  monospacedDigit,
  onSubmit,
  padding,
  shapes,
  strokeBorder,
  submitLabel,
  textContentType as textContentTypeModifier,
  textInputAutocapitalization,
  tint,
  type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { View } from "react-native";

import { layout, type, weights } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type InputSuffix = {
  title: string;
  onPress: () => void;
};

export type InputRef = {
  focus: () => void;
  blur: () => void;
};

export type InputKeyboard = "default" | "email-address" | "decimal-pad";

export type InputContentType =
  | "username"
  | "password"
  | "newPassword"
  | "emailAddress"
  | "name";

export type InputProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: InputSuffix;
  mono?: boolean;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  keyboardType?: InputKeyboard;
  textContentType?: InputContentType;
  returnKeyType?: "next" | "go" | "done";
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  ref?: Ref<InputRef>;
};

const weightNames = {
  [weights.regular]: "regular",
  [weights.medium]: "medium",
  [weights.semibold]: "semibold",
} as const;

const capitalization = {
  none: "never",
  words: "words",
  sentences: "sentences",
  characters: "characters",
} as const;

export function Input({
  value,
  onChangeText,
  label,
  hint,
  error,
  prefix,
  suffix,
  mono = false,
  multiline = false,
  placeholder,
  maxLength,
  autoFocus = false,
  secureTextEntry = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  keyboardType = "default",
  textContentType,
  returnKeyType,
  onSubmitEditing,
  onBlur,
  ref,
}: InputProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const text = useNativeState(value);
  const textField = useRef<TextFieldRef>(null);
  const secureField = useRef<SecureFieldRef>(null);
  const emitted = useRef(value);
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;
  const hasError = error !== undefined;
  const textStyle = mono ? type.numLarge : type.body;

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      text.set(value);
    }
  }, [value, text]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      void (secureTextEntry ? secureField : textField).current?.focus();
    },
    blur: () => {
      void (secureTextEntry ? secureField : textField).current?.blur();
    },
  }));

  const change = (next: string) => {
    emitted.current = next;
    onChangeText(next);
  };

  const focusChange = (next: boolean) => {
    setFocused(next);
    if (!next) {
      onBlur?.();
    }
  };

  const fieldModifiers: ModifierConfig[] = [
    font({ size: textStyle.fontSize, weight: weightNames[textStyle.fontWeight] }),
    foregroundStyle(theme.ink),
    tint(theme.ink),
    keyboardTypeModifier(keyboardType),
    textInputAutocapitalization(capitalization[autoCapitalize]),
    autocorrectionDisabled(!autoCorrect),
  ];
  if (mono) {
    fieldModifiers.push(monospacedDigit());
  }
  if (textContentType !== undefined) {
    fieldModifiers.push(textContentTypeModifier(textContentType));
  }
  if (returnKeyType !== undefined) {
    fieldModifiers.push(submitLabel(returnKeyType));
  }
  if (onSubmitEditing !== undefined) {
    fieldModifiers.push(onSubmit(onSubmitEditing));
  }
  if (multiline) {
    fieldModifiers.push(
      lineLimit(layout.input.multilineLines.min, { reservesSpace: true }),
      frame({ maxWidth: layout.button.fillWidth, alignment: "topLeading" }),
    );
  }

  const placeholderText = (
    <Text modifiers={[foregroundStyle(theme.ink4)]}>{placeholder ?? ""}</Text>
  );

  const borderColor = hasError ? theme.ink : focused ? theme.border2 : theme.border;
  const shape = multiline
    ? shapes.roundedRectangle({ cornerRadius: layout.input.height / 2 })
    : shapes.capsule();

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
      <Host
        matchContents={{ vertical: true }}
        colorScheme={themeName}
        seedColor={theme.ink}
        style={{ alignSelf: "stretch" }}
      >
        <HStack
          alignment={multiline ? "top" : "center"}
          spacing={layout.input.prefixGap}
          modifiers={[
            padding({
              horizontal: layout.input.paddingHorizontal,
              vertical: multiline ? layout.input.multilinePaddingVertical : 0,
            }),
            frame({ minHeight: layout.input.height }),
            background(theme.surface, shape),
            strokeBorder({
              content: borderColor,
              style: { lineWidth: layout.hairline },
              shape: multiline ? "roundedRectangle" : "capsule",
              cornerRadius: layout.input.height / 2,
            }),
          ]}
        >
          {prefix === undefined ? null : (
            <Text
              modifiers={[
                font({
                  size: type.numLarge.fontSize,
                  weight: weightNames[type.numLarge.fontWeight],
                }),
                foregroundStyle(theme.ink3),
              ]}
            >
              {prefix}
            </Text>
          )}
          {secureTextEntry ? (
            <SecureField
              ref={secureField}
              text={text}
              maxLength={maxLength}
              autoFocus={autoFocus}
              onTextChange={change}
              onFocusChange={focusChange}
              modifiers={fieldModifiers}
            >
              <SecureField.Placeholder>{placeholderText}</SecureField.Placeholder>
            </SecureField>
          ) : (
            <TextField
              ref={textField}
              text={text}
              maxLength={maxLength}
              autoFocus={autoFocus}
              axis={multiline ? "vertical" : "horizontal"}
              onTextChange={change}
              onFocusChange={focusChange}
              modifiers={fieldModifiers}
            >
              <TextField.Placeholder>{placeholderText}</TextField.Placeholder>
            </TextField>
          )}
          {suffix === undefined ? null : (
            <SwiftButton
              onPress={suffix.onPress}
              modifiers={[
                buttonStyle("plain"),
                padding({ leading: layout.input.suffixGap - layout.input.prefixGap }),
              ]}
            >
              <Text
                modifiers={[
                  font({
                    size: type.caption.fontSize,
                    weight: weightNames[type.caption.fontWeight],
                  }),
                  foregroundStyle(theme.ink3),
                ]}
              >
                {suffix.title}
              </Text>
            </SwiftButton>
          )}
        </HStack>
      </Host>
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
