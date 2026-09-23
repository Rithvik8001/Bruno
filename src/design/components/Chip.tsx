import { View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { ChipTone } from "../types";
import { T } from "../primitives/T";

export type ChipProps = {
  label: string;
  tone?: ChipTone;
};

export function Chip({ label, tone = "neutral" }: ChipProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        height: layout.chip.height,
        paddingHorizontal: layout.chip.paddingHorizontal,
        borderRadius: radius.pill,
        justifyContent: "center",
        alignSelf: "flex-start",
        backgroundColor: tone === "accent" ? theme.accent : theme.surface,
      }}
    >
      <T
        style="label"
        color={tone === "accent" ? "onAccent" : "ink"}
        numberOfLines={1}
      >
        {label}
      </T>
    </View>
  );
}
