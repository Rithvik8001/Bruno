import { iconSizes, layout } from "../tokens";
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
  const margin = -(layout.hit - size) / 2;

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
        margin,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={icon} size={size} color={color} />
    </Tappable>
  );
}
