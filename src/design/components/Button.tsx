import {
  Button as SwiftButton,
  HStack,
  Host,
  Image,
  Text,
} from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundStyle,
  frame,
  symbolEffect,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { icons, layout } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useSwiftFont } from "../swiftText";
import { useTypeStyle } from "../typography";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";

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
  const reduceMotion = useReduceMotion();
  const labelFont = useSwiftFont("captionStrong");
  const bodyFont = useSwiftFont("bodyMedium");
  const iconSize = useTypeStyle(size === "m" ? "bodyMedium" : "captionStrong").fontSize;
  const inactive = disabled || loading;

  const label = disabled
    ? theme.ink4
    : variant === "primary"
      ? theme.onInk
      : variant === "accent"
        ? theme.onAccent
        : variant === "secondary"
          ? theme.ink
          : theme.ink2;

  const fill = disabled
    ? theme.surface
    : variant === "primary"
      ? theme.ink
      : variant === "accent"
        ? theme.accent
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
              <Image
                systemName={icons.loading}
                size={iconSize}
                color={label}
                modifiers={
                  reduceMotion
                    ? []
                    : [
                        symbolEffect(
                          { effect: "rotate", direction: "clockwise" },
                          { options: { repeat: "continuous" } },
                        ),
                      ]
                }
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
