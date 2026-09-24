import type { ReactNode } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

import { motion } from "../tokens";

export type AppearProps = {
  children: ReactNode;
};

export function Appear({ children }: AppearProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(motion.duration.list).reduceMotion(
        ReduceMotion.System,
      )}
      exiting={FadeOut.duration(motion.duration.fade).reduceMotion(
        ReduceMotion.System,
      )}
      layout={LinearTransition.duration(motion.duration.list).reduceMotion(
        ReduceMotion.System,
      )}
    >
      {children}
    </Animated.View>
  );
}
