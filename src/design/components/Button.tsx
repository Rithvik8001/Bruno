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
  foregroundStyle,
  frame,
  progressViewStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useSwiftFont } from "../swiftText";

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
  const labelFont = useSwiftFont("captionStrong");
  const bodyFont = useSwiftFont("bodyMedium");
  const inactive = disabled || loading;

  const label = inactive
    ? theme.ink4
    : variant === "primary"
      ? theme.onInk
      : variant === "secondary"
        ? theme.ink
        : theme.ink2;

  const fill = inactive
    ? theme.surface
    : variant === "primary"
      ? theme.ink
      : theme.surface;

  const minHeight = size === "m" ? layout.pill.height : layout.pill.heightSmall;

  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy: loading }}
      style={{ alignSelf: inline ? "flex-start" : "stretch" }}
    >
      <Host
        matchContents={inline ? { horizontal: true } : false}
        colorScheme={themeName}
        seedColor={theme.ink}
        style={{ alignSelf: inline ? "flex-start" : "stretch", height: minHeight }}
      >
        <SwiftButton
          onPress={onPress}
          modifiers={[
            buttonStyle(variant === "ghost" ? "plain" : "borderedProminent"),
            buttonBorderShape("capsule"),
            controlSize(size === "m" ? "large" : "regular"),
            tint(fill),
            disabledModifier(inactive),
          ]}
        >
          <HStack
            alignment="center"
            modifiers={[
              frame(
                inline
                  ? { minHeight: minHeight - layout.pill.gap * 2 }
                  : {
                      maxWidth: layout.button.fillWidth,
                      minHeight: minHeight - layout.pill.gap * 2,
                    },
              ),
            ]}
          >
            {loading ? (
              <ProgressView
                modifiers={[progressViewStyle("circular"), tint(theme.ink3)]}
              />
            ) : (
              <Text
                modifiers={[
                  ...(size === "m" ? bodyFont : labelFont),
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
