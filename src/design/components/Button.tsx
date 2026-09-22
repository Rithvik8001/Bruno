import {
  Button as SwiftButton,
  HStack,
  Host,
  ProgressView,
  Text,
} from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  foregroundStyle,
  frame,
  progressViewStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout, type, weights } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonSize = "m" | "s";

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  inline?: boolean;
};

const weightNames = {
  [weights.regular]: "regular",
  [weights.medium]: "medium",
  [weights.semibold]: "semibold",
} as const;

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "m",
  loading = false,
  disabled = false,
  inline = false,
}: ButtonProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const inactive = disabled || loading;

  const label = inactive
    ? theme.ink4
    : variant === "primary"
      ? theme.onInk
      : variant === "secondary"
        ? theme.ink
        : theme.ink2;

  const style =
    variant === "primary"
      ? buttonStyle("glassProminent")
      : variant === "secondary"
        ? buttonStyle("glass")
        : buttonStyle("plain");

  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy: loading }}
      style={{ alignSelf: inline ? "flex-start" : "stretch" }}
    >
      <Host
        matchContents={inline ? true : { vertical: true }}
        colorScheme={themeName}
        seedColor={theme.ink}
        style={{ alignSelf: inline ? "flex-start" : "stretch" }}
      >
        <SwiftButton
          onPress={onPress}
          modifiers={[
            style,
            buttonBorderShape("capsule"),
            controlSize(size === "m" ? "large" : "regular"),
            tint(inactive ? theme.surface2 : theme.ink),
            disabledModifier(inactive),
          ]}
        >
          <HStack
            alignment="center"
            modifiers={inline ? [] : [frame({ maxWidth: layout.button.fillWidth })]}
          >
            {loading ? (
              <ProgressView
                modifiers={[progressViewStyle("circular"), tint(theme.ink3)]}
              />
            ) : (
              <Text
                modifiers={[
                  font({
                    size: type.bodyMedium.fontSize,
                    weight: weightNames[type.bodyMedium.fontWeight],
                  }),
                  foregroundStyle(label),
                ]}
              >
                {title}
              </Text>
            )}
          </HStack>
        </SwiftButton>
      </Host>
    </View>
  );
}
