import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { layout, motion } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { ChipTone } from "../types";
import { usePressScale } from "../primitives/PressScale";
import { T } from "../primitives/T";
import { Chip } from "./Chip";
import { Logo } from "./Logo";

export type LogoRowTone = "ink" | "ink2";

export type LogoRowProps = {
  title: string;
  logo: { name: string; uri: string | null; muted?: boolean };
  subtitle?: string;
  value?: string;
  valueNote?: string;
  chip?: { label: string; tone: ChipTone };
  tone?: LogoRowTone;
  onPress?: () => void;
  highlight?: boolean;
};

export function LogoRow({
  title,
  logo,
  subtitle,
  value,
  valueNote,
  chip,
  tone = "ink",
  onPress,
  highlight = false,
}: LogoRowProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;
  const press = usePressScale("row");
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));

  useEffect(() => {
    if (!highlight) {
      return;
    }
    glow.set(1);
    glow.set(
      withTiming(0, {
        duration: motion.duration.highlight,
        easing: Easing.in(Easing.quad),
      }),
    );
  }, [highlight, glow]);

  return (
    <Animated.View
      style={[{ marginHorizontal: -layout.margin }, press.animatedStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.surface },
          glowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={interactive ? press.onPressIn : undefined}
        onPressOut={interactive ? press.onPressOut : undefined}
        disabled={!interactive}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityLabel={[title, subtitle, value, chip?.label ?? valueNote]
          .filter((part) => part !== undefined)
          .join(", ")}
        style={({ pressed }) => ({
          minHeight: layout.row.logoMinHeight,
          paddingVertical: layout.row.logoPaddingVertical,
          paddingHorizontal: layout.margin,
          flexDirection: "row",
          alignItems: "center",
          gap: layout.row.gap,
          backgroundColor:
            pressed && interactive ? theme.surface : "transparent",
        })}
      >
        <Logo name={logo.name} uri={logo.uri} size="row" muted={logo.muted} />
        <View style={{ flex: 1 }}>
          <T style="bodyMedium" color={tone} numberOfLines={1}>
            {title}
          </T>
          {subtitle === undefined ? null : (
            <T
              style="caption"
              color="ink3"
              numberOfLines={1}
              override={{ marginTop: layout.row.subGap }}
            >
              {subtitle}
            </T>
          )}
        </View>
        {value === undefined && chip === undefined ? null : (
          <View style={{ alignItems: "flex-end", gap: layout.row.subGap }}>
            {value === undefined ? null : (
              <T style="num" color={tone} numberOfLines={1}>
                {value}
              </T>
            )}
            {chip !== undefined ? (
              <Chip label={chip.label} tone={chip.tone} />
            ) : valueNote === undefined ? null : (
              <T style="caption" color="ink3" numberOfLines={1}>
                {valueNote}
              </T>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
