import { ActivityIndicator, Pressable, View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { ColorToken } from "../types";
import { T } from "../primitives/T";

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
  const inactive = disabled || loading;

  const label: ColorToken = inactive
    ? "ink4"
    : variant === "primary"
      ? "onInk"
      : variant === "secondary"
        ? "ink"
        : "ink2";

  const background = (pressed: boolean) => {
    if (inactive) {
      return variant === "ghost" ? "transparent" : theme.surface2;
    }
    if (variant === "primary") {
      return pressed ? theme.ink2 : theme.ink;
    }
    if (variant === "secondary") {
      return pressed ? theme.surface : theme.canvas;
    }
    return pressed ? theme.surface : "transparent";
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy: loading }}
      style={({ pressed }) => ({
        alignSelf: inline ? "flex-start" : "stretch",
        height: size === "m" ? layout.button.height : layout.button.heightSmall,
        borderRadius: radius.control,
        paddingHorizontal: layout.button.paddingHorizontal,
        backgroundColor: background(pressed),
        borderWidth: variant === "secondary" && !inactive ? layout.hairline : 0,
        borderColor: theme.border,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <T
        style="bodyMedium"
        color={label}
        numberOfLines={1}
        override={loading ? { opacity: 0 } : undefined}
      >
        {title}
      </T>
      {loading ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="small" color={theme.ink3} />
        </View>
      ) : null}
    </Pressable>
  );
}
