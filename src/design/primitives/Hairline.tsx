import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";

export type HairlineProps = {
  inset?: number;
};

export function Hairline({ inset = 0 }: HairlineProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        height: layout.hairline,
        marginLeft: inset,
        backgroundColor: theme.hair,
      }}
    />
  );
}
