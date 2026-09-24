import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motion } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";

export type PressScaleKind = keyof typeof motion.pressScale;

export function usePressScale(kind: PressScaleKind, dim = false) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const target = reduceMotion ? 1 : motion.pressScale[kind];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - target) * progress.get() }],
    opacity: dim ? 1 - (1 - motion.pressedOpacity) * progress.get() : 1,
  }));

  const onPressIn = () => {
    progress.set(
      withTiming(1, {
        duration: motion.duration.pressIn,
        easing: Easing.out(Easing.quad),
      }),
    );
  };

  const onPressOut = () => {
    progress.set(
      withTiming(0, {
        duration: motion.duration.pressOut,
        easing: Easing.out(Easing.quad),
      }),
    );
  };

  return { animatedStyle, onPressIn, onPressOut };
}
