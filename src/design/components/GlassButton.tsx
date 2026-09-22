import { layout } from "../tokens";
import { GlassSurface } from "../primitives/GlassSurface";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type GlassButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function GlassButton({
  title,
  onPress,
  disabled = false,
}: GlassButtonProps) {
  return (
    <GlassSurface
      radius={layout.navRow.height / 2}
      interactive
      plain={disabled}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Tappable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        style={{
          height: layout.navRow.height,
          paddingHorizontal: layout.navRow.actionPadding,
          justifyContent: "center",
        }}
      >
        <T style="filter" color="ink" numberOfLines={1}>
          {title}
        </T>
      </Tappable>
    </GlassSurface>
  );
}
