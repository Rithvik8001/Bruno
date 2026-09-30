"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { cn } from "@/lib/utils/cn";
import { backClassName } from "./back-link-styles";

type BackLinkProps = { label: string; className?: string } & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

export function BackLink({ label, className, href, onClick }: BackLinkProps) {
  const content = (
    <>
      <Icon name="chevron-left" size={18} className="shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </>
  );
  if (href !== undefined) {
    return (
      <PressLink href={href} className={cn(backClassName, className)}>
        {content}
      </PressLink>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} {...pressMotion()} className={cn(backClassName, className)}>
      {content}
    </motion.button>
  );
}
