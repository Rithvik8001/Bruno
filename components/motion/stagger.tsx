"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { createContext, use, useEffect, useState } from "react";
import { EASE, SPRING } from "@/lib/motion/tokens";

const FIRST_RENDER_MS = 2500;

const container: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.06, staggerChildren: 0.055 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.46, ease: EASE } },
};

const arrive: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: SPRING },
};

const LateContext = createContext(false);

type StaggerTag = "div" | "ul" | "ol";
type ItemTag = "div" | "li";

export type StaggerProps = Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> & { as?: StaggerTag };

export function Stagger({ as = "div", ...rest }: StaggerProps) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLate(true), FIRST_RENDER_MS);
    return () => window.clearTimeout(id);
  }, []);
  const Tag = motion[as] as typeof motion.div;
  return (
    <LateContext value={late}>
      <Tag variants={container} initial="hidden" animate="show" {...rest} />
    </LateContext>
  );
}

export type StaggerItemProps = Omit<HTMLMotionProps<"div">, "variants"> & { as?: ItemTag };

export function StaggerItem({ as = "div", ...rest }: StaggerItemProps) {
  const late = use(LateContext);
  const Tag = motion[as] as typeof motion.div;
  return <Tag variants={late ? arrive : rise} {...rest} />;
}
