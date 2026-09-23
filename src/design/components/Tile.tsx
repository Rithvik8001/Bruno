import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { layout, motion, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type TileTone = "surface" | "accent";

export type TileProps = {
  label: string;
  tone?: TileTone;
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
  tone = "surface",
}: TileProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;
  const accent = tone === "accent";
  const text = accent ? "onAccent" : "ink";
  const muted = accent ? "onAccent" : "ink3";
  const mutedStyle = accent ? { opacity: layout.tile.mutedOpacity } : undefined;

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
        backgroundColor: accent
          ? theme.accent
          : pressed && interactive
            ? theme.surface2
            : theme.surface,
        opacity: accent && pressed && interactive ? motion.pressedOpacity : 1,
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
        <T
          style="label"
          color={muted}
          numberOfLines={1}
          override={[{ flexShrink: 1 }, mutedStyle]}
        >
          {label}
        </T>
      </View>
      <View>
        <Spacer height={layout.tile.gap} />
        <T
          style="numLarge"
          color={text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={layout.money.minimumScale}
        >
          {value}
        </T>
        {caption === undefined ? null : (
          <T
            style="caption"
            color={muted}
            numberOfLines={1}
            override={[{ marginTop: layout.row.subGap }, mutedStyle]}
          >
            {caption}
          </T>
        )}
      </View>
    </Pressable>
  );
}
