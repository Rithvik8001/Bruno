import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import type { ReactNode } from "react";

import { usePressScale } from "./PressScale";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TappableProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Tappable({
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: TappableProps) {
  const press = usePressScale("control", true);

  return (
    <AnimatedPressable
      disabled={disabled}
      style={[style, press.animatedStyle]}
      onPressIn={(event: GestureResponderEvent) => {
        press.onPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        press.onPressOut();
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
