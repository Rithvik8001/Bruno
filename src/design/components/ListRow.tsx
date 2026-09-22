import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Hairline } from "../primitives/Hairline";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";

export type ListRowTone = "ink" | "ink2";

export type ListRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  valueNote?: string;
  mono?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
  tone?: ListRowTone;
  accessibilityLabel?: string;
};

export function ListRow({
  title,
  subtitle,
  value,
  valueNote,
  mono = true,
  trailing,
  onPress,
  chevron = false,
  last = false,
  tone = "ink",
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;

  return (
    <>
      <Pressable
        onPress={onPress}
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
          paddingHorizontal: layout.row.paddingHorizontal,
          paddingVertical: layout.row.paddingVertical,
          flexDirection: "row",
          alignItems: "center",
          gap: layout.row.gap,
          backgroundColor: pressed && interactive ? theme.surface2 : "transparent",
        })}
      >
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
        {value === undefined ? null : (
          <View style={{ alignItems: "flex-end" }}>
            <T style={mono ? "num" : "caption"} color={tone} numberOfLines={1}>
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
            <Icon name="chevron" size={layout.row.chevron} color="ink4" />
          </View>
        ) : null}
      </Pressable>
      {last ? null : <Hairline />}
    </>
  );
}
