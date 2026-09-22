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
  activeKey?: string;
};

const averageKey = "average";

export function BarChart({ bars, average, activeKey }: BarChartProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const reduceMotion = useReduceMotion();

  return (
    <View>
      <Host colorScheme={themeName} style={{ height: layout.bar.chartHeight }}>
        <Chart
          type="bar"
          data={bars.map((bar) => ({
            x: bar.key,
            y: bar.value,
            color: bar.key === activeKey ? theme.bar : theme.barMuted,
          }))}
          showGrid={false}
          showLegend={false}
          animate={!reduceMotion}
          barStyle={{ cornerRadius: layout.bar.corner, width: layout.bar.width }}
          referenceLines={
            average === undefined ? [] : [{ x: averageKey, y: average }]
          }
          ruleStyle={{
            color: theme.ink3,
            lineWidth: layout.bar.ruleWidth,
            dashArray: [...layout.bar.ruleDash],
          }}
          modifiers={[frame({ height: layout.bar.chartHeight })]}
        />
      </Host>
      <Spacer height={layout.bar.labelGap} />
      <View style={{ flexDirection: "row" }}>
        {bars.map((bar) => (
          <T
            key={bar.key}
            style="label"
            color={bar.key === activeKey ? "ink" : "ink3"}
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
