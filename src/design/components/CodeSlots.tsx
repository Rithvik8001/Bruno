import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type CodeSlotsProps = {
  value: string;
  onChangeValue: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  accessibilityLabel?: string;
};

export function CodeSlots({
  value,
  onChangeValue,
  length = layout.codeSlot.count,
  autoFocus = false,
  onComplete,
  accessibilityLabel = "Verification code",
}: CodeSlotsProps) {
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
      style={{ flexDirection: "row", gap: layout.codeSlot.gap }}
    >
      {Array.from({ length }, (_, index) => {
        const isActive = focused && index === activeIndex;
        const digit = digits[index];

        return (
          <View
            key={index}
            style={{
              flex: 1,
              height: layout.codeSlot.height,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: layout.codeSlot.paddingBottom,
              borderBottomWidth: layout.hairline,
              borderBottomColor: isActive ? theme.accent : theme.hair,
            }}
          >
            {digit === undefined ? (
              isActive ? (
                <View
                  style={{
                    width: layout.codeSlot.caretWidth,
                    height: layout.codeSlot.caretHeight,
                    backgroundColor: theme.accent,
                  }}
                />
              ) : null
            ) : (
              <T style="digit">{digit}</T>
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
