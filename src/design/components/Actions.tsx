import { Button as SwiftButton, Host, Image } from "@expo/ui/swift-ui";
import {
  buttonBorderShape,
  buttonStyle,
  disabled as disabledModifier,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { View } from "react-native";

import { layout } from "../tokens";
import { useReduceTransparency } from "../theme/useAccessibility";
import { useTheme, useThemeName } from "../theme/useTheme";
import type { IconSource } from "../types";
import { resolveSymbol } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type IconActionProps = {
  icon: IconSource;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function IconAction({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
}: IconActionProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const reduceTransparency = useReduceTransparency();

  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={{ width: layout.nav.circle, height: layout.nav.circle }}
    >
      <Host matchContents colorScheme={themeName} seedColor={theme.ink}>
        <SwiftButton
          onPress={onPress}
          modifiers={[
            buttonStyle(reduceTransparency ? "bordered" : "glass"),
            buttonBorderShape("circle"),
            disabledModifier(disabled),
          ]}
        >
          <Image
            systemName={resolveSymbol(icon)}
            size={layout.nav.symbol}
            color={disabled ? theme.ink4 : theme.ink}
            modifiers={[
              frame({
                width: layout.nav.circle - layout.nav.side,
                height: layout.nav.circle - layout.nav.side,
              }),
            ]}
          />
        </SwiftButton>
      </Host>
    </View>
  );
}

export type TextActionProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  prominent?: boolean;
};

export function TextAction({
  title,
  onPress,
  disabled = false,
  prominent = false,
}: TextActionProps) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      style={{
        height: layout.hit,
        paddingHorizontal: layout.nav.side,
        justifyContent: "center",
      }}
    >
      <T
        style="bodyMedium"
        color={disabled ? "ink4" : "ink"}
        numberOfLines={1}
        override={prominent ? { fontWeight: "600" } : undefined}
      >
        {title}
      </T>
    </Tappable>
  );
}

export type NavBarProps = {
  left?: ReactNode;
  right?: ReactNode;
  title?: string;
};

export function NavBar({ left, right, title }: NavBarProps) {
  return (
    <View
      style={{
        height: layout.nav.height,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ minWidth: layout.hit }}>{left ?? null}</View>
      {title === undefined ? null : (
        <T style="bodyMedium" numberOfLines={1} override={{ flex: 1 }} align="center">
          {title}
        </T>
      )}
      <View style={{ minWidth: layout.hit, alignItems: "flex-end" }}>{right ?? null}</View>
    </View>
  );
}
