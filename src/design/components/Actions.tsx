import type { ReactNode } from "react";
import { View } from "react-native";

import { layout } from "../tokens";
import type { IconSource } from "../types";
import { Icon } from "../primitives/Icon";
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
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={{
        width: layout.hit,
        height: layout.hit,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={layout.nav.symbol} color={disabled ? "ink4" : "ink"} />
    </Tappable>
  );
}

export type TextActionProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TextAction({ title, onPress, disabled = false }: TextActionProps) {
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
      <T style="bodyMedium" color={disabled ? "ink4" : "ink"} numberOfLines={1}>
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
        marginHorizontal: -layout.nav.side,
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
