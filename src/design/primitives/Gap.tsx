import { View } from "react-native";

import { space } from "../tokens";
import type { SpaceToken } from "../types";

export type GapProps = {
  size: SpaceToken;
  horizontal?: boolean;
};

export function Gap({ size, horizontal = false }: GapProps) {
  const value = space[size];
  return <View style={horizontal ? { width: value } : { height: value }} />;
}
