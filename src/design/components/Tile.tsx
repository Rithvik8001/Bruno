import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type TileProps = {
  label: string;
  value: string;
  caption?: string;
  leading?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Tile({
  label,
  value,
  caption,
  leading,
  onPress,
  accessibilityLabel,
}: TileProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? "button" : undefined}
      accessibilityLabel={
        accessibilityLabel ??
        [label, value, caption].filter((part) => part !== undefined).join(", ")
      }
      style={({ pressed }) => ({
        flex: 1,
        minHeight: layout.tile.minHeight,
        padding: layout.tile.padding,
        borderRadius: radius.tile,
        borderCurve: "continuous",
        backgroundColor: pressed && interactive ? theme.surface2 : theme.surface,
        justifyContent: "space-between",
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: layout.tile.logoGap,
        }}
      >
        {leading ?? null}
        <T style="label" color="ink3" numberOfLines={1} override={{ flexShrink: 1 }}>
          {label}
        </T>
      </View>
      <View>
        <Spacer height={layout.tile.gap} />
        <T
          style="numLarge"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={layout.money.minimumScale}
        >
          {value}
        </T>
        {caption === undefined ? null : (
          <T
            style="caption"
            color="ink3"
            numberOfLines={1}
            override={{ marginTop: layout.row.subGap }}
          >
            {caption}
          </T>
        )}
      </View>
    </Pressable>
  );
}
