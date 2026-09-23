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
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { View } from "react-native";

import { layout, motion, radius } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useSwiftFont } from "../swiftText";
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
  "username" | "password" | "newPassword" | "emailAddress" | "name";

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
  onFocus?: () => void;
  ref?: Ref<InputRef>;
};

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
  onFocus,
  ref,
}: InputProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const text = useNativeState(value);
  const textField = useRef<TextFieldRef>(null);
  const secureField = useRef<SecureFieldRef>(null);
  const emitted = useRef(value);
  const pendingSubmit = useRef(false);
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;
  const hasError = error !== undefined;
  const fieldFont = useSwiftFont(mono ? "numLarge" : "body");
  const prefixFont = useSwiftFont("numLarge");
  const suffixFont = useSwiftFont("caption");

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      text.set(value);
    }
    if (pendingSubmit.current) {
      pendingSubmit.current = false;
      onSubmitEditing?.();
    }
  }, [value, text, onSubmitEditing]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      void (secureTextEntry ? secureField : textField).current?.focus();
    },
    blur: () => {
      void (secureTextEntry ? secureField : textField).current?.blur();
    },
  }));

  const emit = (next: string) => {
    if (next === emitted.current) {
      return;
    }
    emitted.current = next;
    onChangeText(next);
  };

  const nativeText = (fallback: string): string => {
    const current: unknown = text.get();
    return typeof current === "string" ? current : fallback;
  };

  const change = (next: string) => {
    emit(nativeText(next));
  };

  const sync = () => {
    emit(nativeText(emitted.current));
  };

  const latestSync = useRef(sync);

  useEffect(() => {
    latestSync.current = sync;
  });

  useEffect(() => {
    if (!focused) {
      return;
    }
    const timer = setInterval(
      () => latestSync.current(),
      motion.duration.inputSync,
    );
    return () => clearInterval(timer);
  }, [focused]);

  const focusChange = (next: boolean) => {
    setFocused(next);
    if (next) {
      onFocus?.();
      return;
    }
    sync();
    onBlur?.();
  };

  const submit = () => {
    const current = nativeText(emitted.current);
    if (current === emitted.current) {
      onSubmitEditing?.();
      return;
    }
    pendingSubmit.current = true;
    emit(current);
  };

  const fieldModifiers: ModifierConfig[] = [
    ...fieldFont,
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
    fieldModifiers.push(onSubmit(submit));
  }
  if (multiline) {
    fieldModifiers.push(
      lineLimit(layout.field.multilineLines.min, { reservesSpace: true }),
      frame({ maxWidth: layout.button.fillWidth, alignment: "topLeading" }),
    );
  }

  const placeholderText = (
    <Text modifiers={[foregroundStyle(theme.ink4)]}>{placeholder ?? ""}</Text>
  );

  const outlined = hasError || focused;
  const shellModifiers: ModifierConfig[] = [
    padding({
      horizontal: layout.field.paddingHorizontal,
      vertical: multiline ? layout.field.multilinePaddingVertical : 0,
    }),
    frame({ minHeight: layout.field.height, maxWidth: layout.button.fillWidth }),
    background(
      theme.canvas,
      shapes.roundedRectangle({
        cornerRadius: radius.field,
        roundedCornerStyle: "continuous",
      }),
    ),
    strokeBorder({
      content: outlined ? theme.ink : theme.border,
      style: { lineWidth: outlined ? layout.field.focus : layout.field.border },
      shape: "roundedRectangle",
      cornerRadius: radius.field,
    }),
  ];

  return (
    <View>
      {label === undefined ? null : (
        <>
          <T style="label" color="ink3" numberOfLines={1}>
            {label}
          </T>
          <Spacer height={layout.field.labelGap} />
        </>
      )}
      <Host
        matchContents={multiline ? { vertical: true } : false}
        colorScheme={themeName}
        seedColor={theme.ink}
        style={{
          alignSelf: "stretch",
          height: multiline ? undefined : layout.field.height,
        }}
      >
          <HStack
            alignment={multiline ? "top" : "center"}
            spacing={layout.field.prefixGap}
            modifiers={shellModifiers}
          >
            {prefix === undefined ? null : (
              <Text modifiers={[...prefixFont, foregroundStyle(theme.ink3)]}>
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
                <SecureField.Placeholder>
                  {placeholderText}
                </SecureField.Placeholder>
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
                  padding({
                    leading: layout.field.suffixGap - layout.field.prefixGap,
                  }),
                ]}
              >
                <Text modifiers={[...suffixFont, foregroundStyle(theme.ink2)]}>
                  {suffix.title}
                </Text>
              </SwiftButton>
            )}
          </HStack>
      </Host>
      {note === undefined ? null : (
        <>
          <Spacer height={layout.field.hintGap} />
          <T style="caption" color={hasError ? "ink2" : "ink3"}>
            {note}
          </T>
        </>
      )}
    </View>
  );
}
