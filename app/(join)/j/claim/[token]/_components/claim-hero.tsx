"use client";

import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar";
import { GroupArtTile } from "@/components/ui/icon-3d";
import type { BillGroupRef } from "@/lib/bills/queries";
import { SPRING_CURVE } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";

export function ClaimHero({ group, person, pop = false }: { group: BillGroupRef; person: PersonView; pop?: boolean }) {
  return (
    <span className="relative block h-20 w-22">
      <GroupArtTile name={group.name} tint={group.tint} art={group.art} size="xl" className="absolute top-0 left-0" />
      <motion.span
        key={person.id}
        className="absolute right-0 bottom-0 block rounded-full ring-3 ring-bg"
        initial={pop ? { opacity: 0, scale: 0.3 } : false}
        animate={{ opacity: 1, scale: [0.3, 1.12, 1] }}
        transition={{ duration: 0.42, delay: 0.12, ease: SPRING_CURVE }}
      >
        <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
      </motion.span>
    </span>
  );
}
