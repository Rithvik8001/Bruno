import { Chart, Host } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, View } from "react-native";

import { layout } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useThemeName } from "../theme/useTheme";
import { MoneyHero } from "./MoneyHero";

export type DonutSlice = {
  key: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  slices: readonly DonutSlice[];
  amount: string;
  caption: string;
};

export function DonutChart({ slices, amount, caption }: DonutChartProps) {
  const themeName = useThemeName();
  const reduceMotion = useReduceMotion();

  return (
    <View style={{ height: layout.chart.donutHeight }}>
      <Host colorScheme={themeName} style={{ height: layout.chart.donutHeight }}>
        <Chart
          type="pie"
          data={slices.map((slice) => ({
            x: slice.key,
            y: slice.value,
            color: slice.color,
          }))}
          showGrid={false}
          showLegend={false}
          animate={!reduceMotion}
          pieStyle={{
            innerRadius: layout.chart.donutInner,
            angularInset: layout.chart.angularInset,
          }}
          modifiers={[frame({ height: layout.chart.donutHeight })]}
        />
      </Host>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <View style={{ width: layout.chart.centerWidth, alignItems: "center" }}>
          <MoneyHero size="s" amount={amount} caption={caption} />
        </View>
      </View>
    </View>
  );
}
