import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { layout, motion, radius } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme } from "../theme/useTheme";

export type LoadingProps = {
  rows?: number;
  variant?: "rows" | "hero";
  accessibilityLabel?: string;
};

const restOpacity = 0.5;

function Bar({
  width,
  height,
}: {
  width: number | `${number}%`;
  height: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius.compact,
        backgroundColor: theme.surface,
      }}
    />
  );
}

export function Loading({
  rows = layout.loading.rows,
  variant = "rows",
  accessibilityLabel = "Loading",
}: LoadingProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (reduceMotion) {
      opacity.set(1);
      return;
    }
    opacity.set(
      withRepeat(
        withTiming(restOpacity, { duration: motion.duration.pulse }),
        -1,
        true,
      ),
    );
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      exiting={FadeOut.duration(motion.duration.fade).reduceMotion(
        ReduceMotion.System,
      )}
    >
      <Animated.View style={pulse}>
        {variant === "hero" ? (
          <View
            style={{ paddingBottom: layout.bottom, gap: layout.loading.gap }}
          >
            <Bar
              width={`${layout.loading.short * 100}%`}
              height={layout.loading.bar}
            />
            <Bar
              width={`${layout.loading.long * 100}%`}
              height={layout.loading.hero}
            />
          </View>
        ) : null}
        <View>
          {Array.from({ length: rows }, (_, index) => (
            <View
              key={index}
              style={{
                minHeight: layout.row.logoMinHeight,
                flexDirection: "row",
                alignItems: "center",
                gap: layout.row.gap,
              }}
            >
              <View
                style={{
                  width: layout.logo.row,
                  height: layout.logo.row,
                  borderRadius: radius.pill,
                  backgroundColor: theme.surface,
                }}
              />
              <View style={{ flex: 1, gap: layout.loading.gap }}>
                <Bar
                  width={`${layout.loading.long * 100}%`}
                  height={layout.loading.bar}
                />
                <Bar
                  width={`${layout.loading.short * 100}%`}
                  height={layout.loading.bar}
                />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
