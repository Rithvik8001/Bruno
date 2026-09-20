import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, View } from "react-native";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useReduceTransparency } from "../theme/useAccessibility";

export type GlassSurfaceProps = {
  radius: number;
};

function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function GlassSurface({ radius }: GlassSurfaceProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const reduceTransparency = useReduceTransparency();
  const liquidGlass = isLiquidGlassAvailable();

  if (reduceTransparency || !liquidGlass) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: reduceTransparency
              ? withOpacity(theme.paper, layout.tabBar.reduceTransparency.paperOpacity)
              : theme.glass,
          },
        ]}
      />
    );
  }

  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme={themeName}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
    />
  );
}
