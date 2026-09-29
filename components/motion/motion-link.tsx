"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { pressMotion } from "./press";

export const MotionLink = motion.create(Link);

export type PressLinkProps = ComponentProps<typeof MotionLink> & { wide?: boolean };

export function PressLink({ wide = false, ...rest }: PressLinkProps) {
  return <MotionLink {...pressMotion(wide)} {...rest} />;
}
