import { iconSizes, layout } from "../tokens";
import { GlassSurface } from "../primitives/GlassSurface";
import { Icon, type IconColorToken } from "../primitives/Icon";
import { Tappable } from "../primitives/Tappable";
import type { IconSource } from "../types";

export type IconButtonProps = {
  icon: IconSource;
  onPress: () => void;
  accessibilityLabel: string;
  color?: IconColorToken;
  size?: number;
  disabled?: boolean;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = "ink",
  size = iconSizes.bar,
  disabled = false,
}: IconButtonProps) {
  const button = (
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
      <Icon name={icon} size={size} color={color} />
    </Tappable>
  );

  return (
    <GlassSurface
      radius={layout.hit / 2}
      interactive
      plain={disabled}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      {button}
    </GlassSurface>
  );
}
