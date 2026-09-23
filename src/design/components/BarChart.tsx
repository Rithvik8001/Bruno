import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { layout, motion, radius } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  amount: string;
};

export type BarChartProps = {
  bars: readonly BarDatum[];
  activeKey?: string;
  accessibilityLabel?: string;
};

function Bar({ share, active }: { share: number; active: boolean }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0);
  const grow = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.get() }],
  }));
  const height = Math.max(
    layout.chart.stub,
    Math.round(layout.chart.height * Math.max(0, Math.min(1, share))),
  );

  useEffect(() => {
    scale.set(reduceMotion ? 1 : withTiming(1, { duration: motion.duration.count }));
  }, [scale, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          width: layout.chart.barWidth,
          height,
          borderRadius: layout.chart.corner,
          backgroundColor:
            share <= 0 ? theme.barMuted : active ? theme.accent : theme.bar,
          transformOrigin: "bottom",
        },
        grow,
      ]}
    />
  );
}

export function BarChart({ bars, activeKey, accessibilityLabel }: BarChartProps) {
  const theme = useTheme();
  const peak = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ marginHorizontal: -layout.margin }}
      contentContainerStyle={{ paddingHorizontal: layout.margin }}
    >
      {bars.map((bar) => {
        const active = bar.key === activeKey;
        return (
          <View
            key={bar.key}
            style={{ width: layout.chart.column, alignItems: "center" }}
          >
            <View
              style={{
                height: layout.chart.height,
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Bar share={bar.value / peak} active={active} />
            </View>
            <Spacer height={layout.chart.labelGap} />
            <View
              style={{
                height: layout.chart.pillHeight,
                paddingHorizontal: layout.chart.pillPadding,
                borderRadius: radius.pill,
                justifyContent: "center",
                backgroundColor: active ? theme.ink : theme.surface,
              }}
            >
              <T style="label" color={active ? "onInk" : "ink"} numberOfLines={1}>
                {bar.label}
              </T>
            </View>
            <Spacer height={layout.chart.amountGap} />
            <T style="label" color="ink3" numberOfLines={1}>
              {bar.amount}
            </T>
          </View>
        );
      })}
    </ScrollView>
  );
}
