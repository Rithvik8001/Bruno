import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

import { motion } from "../tokens";

export type TappableProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Tappable({
  children,
  style,
  disabled,
  ...rest
}: TappableProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { opacity: motion.pressedOpacity } : null,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
