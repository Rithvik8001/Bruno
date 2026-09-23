import { Pressable, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { ChipTone } from "../types";
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
}: LogoRowProps) {
  const theme = useTheme();
  const interactive = onPress !== undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? "button" : undefined}
      accessibilityLabel={[title, subtitle, value, chip?.label ?? valueNote]
        .filter((part) => part !== undefined)
        .join(", ")}
      style={({ pressed }) => ({
        minHeight: layout.row.logoMinHeight,
        paddingVertical: layout.row.paddingVertical,
        marginHorizontal: -layout.margin,
        paddingHorizontal: layout.margin,
        flexDirection: "row",
        alignItems: "center",
        gap: layout.row.gap,
        backgroundColor: pressed && interactive ? theme.surface : "transparent",
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
  );
}
