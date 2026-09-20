import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "../theme/useTheme";
import type { ColorToken, TypeToken } from "../types";
import { useTypeStyle } from "../typography";

export type TProps = Omit<TextProps, "style" | "allowFontScaling"> & {
  style: TypeToken;
  color?: ColorToken;
  align?: TextStyle["textAlign"];
  override?: StyleProp<TextStyle>;
};

export function T({ style, color = "ink", align, override, ...rest }: TProps) {
  const theme = useTheme();
  const typeStyle = useTypeStyle(style);

  return (
    <Text
      allowFontScaling={false}
      style={[typeStyle, { color: theme[color], textAlign: align }, override]}
      {...rest}
    />
  );
}
