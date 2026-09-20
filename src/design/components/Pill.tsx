import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type PillProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function Pill({ title, onPress, disabled = false }: PillProps) {
  const theme = useTheme();

  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      style={{
        height: layout.pill.height,
        borderRadius: layout.pill.radius,
        backgroundColor: theme.ink,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <T style="button" color="onInk" numberOfLines={1}>
        {title}
      </T>
    </Tappable>
  );
}
