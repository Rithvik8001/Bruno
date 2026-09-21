import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import type { ReactNode } from "react";
import { View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { useReduceTransparency } from "../theme/useAccessibility";

export type GlassSurfaceProps = {
  radius: number;
  interactive?: boolean;
  tint?: ColorValue;
  plain?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function useLiquidGlass(): boolean {
  const reduceTransparency = useReduceTransparency();
  return (
    !reduceTransparency && isLiquidGlassAvailable() && isGlassEffectAPIAvailable()
  );
}

export function GlassSurface({
  radius,
  interactive = false,
  tint,
  plain = false,
  style,
  children,
}: GlassSurfaceProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const liquidGlass = useLiquidGlass();

  if (!liquidGlass || plain) {
    return (
      <View
        style={[
          {
            borderRadius: radius,
            backgroundColor: tint ?? theme.paper,
            borderWidth: tint === undefined ? layout.hairline : 0,
            borderColor: theme.hair,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme={themeName}
      isInteractive={interactive}
      tintColor={tint}
      style={[{ borderRadius: radius }, style]}
    >
      {children}
    </GlassView>
  );
}
