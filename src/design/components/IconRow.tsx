import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { IconSource } from "../types";
import { Icon } from "../primitives/Icon";
import { usePressScale } from "../primitives/PressScale";
import { T } from "../primitives/T";

export type IconRowTone = "ink" | "ink2";

export type IconRowProps = {
  title: string;
  icon?: IconSource;
  iconBounce?: number;
  subtitle?: string;
  subtitleLines?: number;
  value?: string;
  valueNote?: string;
  mono?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  tone?: IconRowTone;
  accessibilityLabel?: string;
};

export function IconRow({
  title,
  icon,
  iconBounce,
  subtitle,
  subtitleLines = 1,
  value,
  valueNote,
  mono = true,
  trailing,
  onPress,
  chevron = false,
  tone = "ink",
  accessibilityLabel,
}: IconRowProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;
  const press = usePressScale("row");

  return (
    <Animated.View style={press.animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={interactive ? press.onPressIn : undefined}
        onPressOut={interactive ? press.onPressOut : undefined}
        disabled={!interactive}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityLabel={
          accessibilityLabel ??
          [title, subtitle, value, valueNote]
            .filter((part) => part !== undefined)
            .join(", ")
        }
        style={({ pressed }) => ({
          minHeight: layout.row.minHeight,
          paddingVertical: layout.row.paddingVertical,
          flexDirection: "row",
          alignItems: "center",
          gap: layout.row.gap,
          backgroundColor:
            pressed && interactive ? theme.surface : "transparent",
        })}
      >
        {icon === undefined ? null : (
          <Icon name={icon} size={layout.icon.row} color={tone} bounce={iconBounce} />
        )}
        <View style={{ flex: 1 }}>
          <T style="bodyMedium" color={tone} numberOfLines={1}>
            {title}
          </T>
          {subtitle === undefined ? null : (
            <T
              style="caption"
              color="ink3"
              numberOfLines={subtitleLines}
              override={{ marginTop: layout.row.subGap }}
            >
              {subtitle}
            </T>
          )}
        </View>
        {value === undefined ? null : (
          <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
            <T style={mono ? "num" : "body"} color={tone} numberOfLines={1}>
              {value}
            </T>
            {valueNote === undefined ? null : (
              <T
                style="caption"
                color="ink3"
                numberOfLines={1}
                override={{ marginTop: layout.row.subGap }}
              >
                {valueNote}
              </T>
            )}
          </View>
        )}
        {trailing ?? null}
        {chevron ? (
          <View style={{ marginLeft: -layout.row.gap + layout.row.chevronGap }}>
            <Icon name="chevron" size={layout.row.chevron} color={tone} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
