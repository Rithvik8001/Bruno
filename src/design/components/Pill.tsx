import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { GlassSurface } from "../primitives/GlassSurface";
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
    <GlassSurface
      radius={layout.pill.radius}
      interactive
      plain={disabled}
      tint={theme.ink}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Tappable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        style={{
          height: layout.pill.height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T style="button" color="onInk" numberOfLines={1}>
          {title}
        </T>
      </Tappable>
    </GlassSurface>
  );
}
