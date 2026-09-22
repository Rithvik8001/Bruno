import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type CodeInputProps = {
  value: string;
  onChangeValue: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  length?: number;
  accessibilityLabel?: string;
};

const defaultLength = 6;

export function CodeInput({
  value,
  onChangeValue,
  onComplete,
  error = false,
  autoFocus = false,
  length = defaultLength,
  accessibilityLabel = "Verification code",
}: CodeInputProps) {
  const theme = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);

  const digits = value.slice(0, length).split("");
  const activeIndex = Math.min(digits.length, length - 1);

  const handleChange = (next: string) => {
    const cleaned = next.replace(/[^0-9]/g, "").slice(0, length);
    onChangeValue(cleaned);
    if (cleaned.length === length) {
      onComplete?.(cleaned);
    }
  };

  return (
    <Pressable
      onPress={() => input.current?.focus()}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", gap: layout.code.gap }}
    >
      {Array.from({ length }, (_, index) => {
        const isActive = focused && index === activeIndex;
        const digit = digits[index];
        const underline = error
          ? theme.ink2
          : digit !== undefined || isActive
            ? theme.ink
            : theme.border;

        return (
          <View
            key={index}
            style={{
              flex: 1,
              height: layout.code.cell,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: layout.code.underline,
              borderBottomColor: underline,
            }}
          >
            {digit === undefined ? (
              isActive ? (
                <View
                  style={{
                    width: layout.code.caretWidth,
                    height: layout.code.caretHeight,
                    backgroundColor: theme.ink,
                  }}
                />
              ) : null
            ) : (
              <T style="code">{digit}</T>
            )}
          </View>
        );
      })}
      <TextInput
        ref={input}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        caretHidden
        allowFontScaling={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0,
        }}
      />
    </Pressable>
  );
}
