import { Image } from "expo-image";

import { useTheme } from "../theme/useTheme";
import type { ColorToken } from "../types";

export type BrandMarkProps = {
  size: number;
  color?: ColorToken;
};

const mark = require("../../../assets/images/mark.png");

export function BrandMark({ size, color = "ink" }: BrandMarkProps) {
  const theme = useTheme();

  return (
    <Image
      source={mark}
      tintColor={theme[color]}
      contentFit="contain"
      accessible={false}
      style={{ width: size, height: size }}
    />
  );
}
