"use client";

import { motion } from "motion/react";
import { GroupArtTile, type GroupArtTileProps } from "@/components/ui/icon-3d";
import { SPRING } from "@/lib/motion/tokens";

export function HeaderArt(props: GroupArtTileProps) {
  return (
    <motion.span className="inline-grid shrink-0" whileHover={{ scale: 1.05, rotate: -3 }} transition={SPRING}>
      <GroupArtTile {...props} />
    </motion.span>
  );
}
