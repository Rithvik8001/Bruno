import { View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";

export type LoadingProps = {
  rows?: number;
  accessibilityLabel?: string;
};

export function Loading({ rows = layout.loading.rows, accessibilityLabel = "Loading" }: LoadingProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={{
            minHeight: layout.row.minHeight,
            justifyContent: "center",
            gap: layout.loading.gap,
          }}
        >
          <View
            style={{
              width: `${layout.loading.long * 100}%`,
              height: layout.loading.bar,
              borderRadius: radius.compact,
              backgroundColor: theme.surface2,
            }}
          />
          <View
            style={{
              width: `${layout.loading.short * 100}%`,
              height: layout.loading.bar,
              borderRadius: radius.compact,
              backgroundColor: theme.surface2,
            }}
          />
        </View>
      ))}
    </View>
  );
}
