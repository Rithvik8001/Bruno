import type { ReactNode } from "react";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

import { motion } from "../tokens";

export type EnteringProps = {
  index: number;
  children: ReactNode;
};

export function Entering({ index, children }: EnteringProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.duration.enter)
        .delay(Math.min(index, motion.staggerMax) * motion.stagger)
        .withInitialValues({
          opacity: 0,
          transform: [{ translateY: motion.enterOffset }],
        })
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
