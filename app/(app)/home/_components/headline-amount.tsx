"use client";

import { motion, useAnimate, useReducedMotion, type Transition } from "motion/react";
import { useState } from "react";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { Tint } from "@/lib/design-system/tokens";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { POP } from "@/lib/motion/keyframes";
import { EASE, SPRING_CURVE } from "@/lib/motion/tokens";

const SWEEP_S = 0.9;
const SWEEP_HOLD = 0.35;
const MARKER = "100% 42%";

const sweep: Transition = { delay: SWEEP_S * SWEEP_HOLD, duration: SWEEP_S * (1 - SWEEP_HOLD), ease: EASE };
const settle: Transition = { duration: 0.2, ease: SPRING_CURVE };

export interface HeadlineAmountProps {
  amount: string;
  tint: Tint;
  tooltip: string;
}

export function HeadlineAmount({ amount, tint, tooltip }: HeadlineAmountProps) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const [swept, setSwept] = useState(false);

  const pop = () => {
    buzz(HAPTICS.addPress);
    if (!reduce) animate(scope.current, POP.keyframes, POP.transition);
  };

  return (
    <motion.span
      ref={scope}
      data-tint={tint}
      title={tooltip}
      initial={reduce ? false : { backgroundSize: "0% 42%" }}
      animate={{ backgroundSize: MARKER }}
      whileHover={{ backgroundSize: "100% 100%" }}
      transition={swept || reduce ? settle : sweep}
      onAnimationComplete={() => setSwept(true)}
      onTap={pop}
      className="ml-2 -mr-1.5 inline-block cursor-default rounded-xs bg-[linear-gradient(var(--tint-bg),var(--tint-bg))] bg-position-[0_88%] bg-no-repeat px-1.5 text-tint"
    >
      <RollingNumber value={amount} />
    </motion.span>
  );
}
