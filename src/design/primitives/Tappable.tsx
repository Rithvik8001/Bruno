import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

export const pressedOpacity = 0.55;

export type TappableProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Tappable({ children, style, disabled, ...rest }: TappableProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [style, { opacity: pressed && !disabled ? pressedOpacity : 1 }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
