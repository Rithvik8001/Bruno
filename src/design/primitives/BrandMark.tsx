import { Image } from "expo-image";

export type BrandMarkProps = {
  size: number;
};

const mark = require("../../../assets/images/mark.png");

export function BrandMark({ size }: BrandMarkProps) {
  return (
    <Image
      source={mark}
      contentFit="contain"
      accessible={false}
      style={{ width: size, height: size }}
    />
  );
}
