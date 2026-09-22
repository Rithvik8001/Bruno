import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";

export type ContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Container({ children, style }: ContainerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          borderRadius: radius.container,
          borderCurve: "continuous",
          borderWidth: layout.hairline,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
