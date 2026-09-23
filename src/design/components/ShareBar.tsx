import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { layout, motion } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme } from "../theme/useTheme";
import { T } from "../primitives/T";

export type ShareBarProps = {
  label: string;
  amount: string;
  share: number;
  caption: string;
  active?: boolean;
};

function Fill({ share, active }: { share: number; active: boolean }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0);
  const grow = useAnimatedStyle(() => ({
    transform: [{ scaleX: scale.get() }],
  }));

  useEffect(() => {
    scale.set(reduceMotion ? 1 : withTiming(1, { duration: motion.duration.count }));
  }, [scale, reduceMotion]);

  return (
    <View
      style={{
        height: layout.bar.height,
        borderRadius: layout.bar.trackRadius,
        backgroundColor: theme.barMuted,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            width: `${Math.max(0, Math.min(1, share)) * 100}%`,
            height: layout.bar.height,
            borderRadius: layout.bar.trackRadius,
            backgroundColor: active ? theme.accent : theme.bar,
            transformOrigin: "left",
          },
          grow,
        ]}
      />
    </View>
  );
}

export function ShareBar({
  label,
  amount,
  share,
  caption,
  active = false,
}: ShareBarProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${amount}, ${caption}`}
      style={{
        minHeight: layout.bar.rowHeight,
        paddingBottom: layout.bar.rowSpacing,
        justifyContent: "center",
        gap: layout.bar.rowGap,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: layout.row.gap }}>
        <T style="bodyMedium" numberOfLines={1} override={{ flex: 1 }}>
          {label}
        </T>
        <T style="num" numberOfLines={1}>
          {amount}
        </T>
      </View>
      <Fill share={share} active={active} />
      <T style="caption" color="ink3" numberOfLines={1}>
        {caption}
      </T>
    </View>
  );
}
