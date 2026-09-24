import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";

export function Divider() {
  const theme = useTheme();

  return (
    <View
      style={{
        height: layout.hairline,
        marginVertical: layout.divider.gap,
        backgroundColor: theme.border,
      }}
    />
  );
}
