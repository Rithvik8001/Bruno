import { Chart, Host } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme, useThemeName } from "../theme/useTheme";
import { Spacer } from "../primitives/Spacer";
import { T } from "../primitives/T";

export type BarDatum = {
  key: string;
  label: string;
  value: number;
};

export type BarChartProps = {
  bars: readonly BarDatum[];
  average?: number;
};

const averageKey = "average";

export function BarChart({ bars, average }: BarChartProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const reduceMotion = useReduceMotion();

  return (
    <View>
      <Host colorScheme={themeName} style={{ height: layout.chart.barHeight }}>
        <Chart
          type="bar"
          data={bars.map((bar) => ({
            x: bar.key,
            y: bar.value,
            color: theme.chartBar,
          }))}
          showGrid={false}
          showLegend={false}
          animate={!reduceMotion}
          barStyle={{
            cornerRadius: layout.chart.barCorner,
            width: layout.chart.barWidth,
          }}
          referenceLines={
            average === undefined ? [] : [{ x: averageKey, y: average }]
          }
          ruleStyle={{
            color: theme.ink3,
            lineWidth: layout.chart.ruleWidth,
            dashArray: [...layout.chart.ruleDash],
          }}
          modifiers={[frame({ height: layout.chart.barHeight })]}
        />
      </Host>
      <Spacer height={layout.chart.barLabelGap} />
      <View style={{ flexDirection: "row" }}>
        {bars.map((bar) => (
          <T
            key={bar.key}
            style="sub"
            color="ink3"
            align="center"
            override={{ flex: 1 }}
            numberOfLines={1}
          >
            {bar.label}
          </T>
        ))}
      </View>
    </View>
  );
}
