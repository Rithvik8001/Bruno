import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useReduceTransparency } from "../theme/useAccessibility";
import { GlassSurface } from "../primitives/GlassSurface";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";
import type { IconSource } from "../types";

export type TabBarItem<TKey extends string> = {
  key: TKey;
  label: string;
  icon: IconSource;
};

export type TabBarProps<TKey extends string> = {
  items: readonly TabBarItem<TKey>[];
  value: TKey;
  onChange: (key: TKey) => void;
};

export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return layout.tabBar.height + layout.tabBar.bottom + insets.bottom;
}

export function TabBar<TKey extends string>({
  items,
  value,
  onChange,
}: TabBarProps<TKey>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceTransparency = useReduceTransparency();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: "absolute",
        left: layout.tabBar.inset,
        right: layout.tabBar.inset,
        bottom: layout.tabBar.bottom + insets.bottom,
        height: layout.tabBar.height,
        borderRadius: layout.tabBar.radius,
        shadowColor: theme.glassShadow.color,
        shadowOpacity: reduceTransparency ? 0 : theme.glassShadow.opacity,
        shadowRadius: theme.glassShadow.radius,
        shadowOffset: { width: 0, height: theme.glassShadow.offsetY },
      }}
    >
      <GlassSurface radius={layout.tabBar.radius} />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          padding: layout.tabBar.padding,
          borderRadius: layout.tabBar.radius,
          borderWidth: layout.hairline,
          borderColor: theme.glassBorder,
          overflow: "hidden",
        }}
      >
        {items.map((item) => {
          const active = item.key === value;

          return (
            <Tappable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={{
                flex: 1,
                height: layout.tabBar.item.height,
                borderRadius: layout.tabBar.item.radius,
                alignItems: "center",
                justifyContent: "center",
                gap: layout.tabBar.item.gap,
                backgroundColor: active ? theme.glassPill : "transparent",
              }}
            >
              <Icon
                name={item.icon}
                size={layout.tabBar.item.icon}
                color={active ? "ink" : "ink3"}
              />
              <T
                style="tab"
                color={active ? "ink" : "ink3"}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                align="center"
                override={{ width: "100%" }}
              >
                {item.label}
              </T>
            </Tappable>
          );
        })}
      </View>
    </View>
  );
}
