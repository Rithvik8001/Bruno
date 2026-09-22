import { Button, Host, Image } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as accessibilityLabelModifier,
  buttonStyle,
  frame,
} from "@expo/ui/swift-ui/modifiers";

import { iconSizes, layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { resolveSymbol, type IconColorToken } from "../primitives/Icon";
import type { IconSource } from "../types";

export type NativeIconButtonStyle = "glass" | "plain";

export type NativeIconButtonProps = {
  icon: IconSource;
  onPress: () => void;
  accessibilityLabel: string;
  color?: IconColorToken;
  size?: number;
  style?: NativeIconButtonStyle;
};

export function NativeIconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = "ink",
  size = iconSizes.bar,
  style = "glass",
}: NativeIconButtonProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <Host
      colorScheme={themeName}
      style={{ width: layout.hit, height: layout.hit }}
    >
      <Button
        onPress={onPress}
        modifiers={[
          frame({ width: layout.hit, height: layout.hit }),
          buttonStyle(style),
          accessibilityLabelModifier(accessibilityLabel),
        ]}
      >
        <Image
          systemName={resolveSymbol(icon)}
          size={size}
          color={theme[color]}
        />
      </Button>
    </Host>
  );
}
