"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { Rise } from "@/components/motion/rise";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FoundPerson } from "@/lib/members/types";
import { groupDetailCopy } from "../../_data";

export type FoundState = "found" | "former" | "added" | "member";

export interface FoundCardProps {
  person: FoundPerson;
  state: FoundState;
  groupName: string;
  pending: boolean;
  onAdd: () => void;
}

export function FoundCard({ person, state, groupName, pending, onAdd }: FoundCardProps) {
  const copy = groupDetailCopy.addPeople;
  return (
    <Rise className="grid gap-3 rounded-card bg-surface p-4">
      <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
        <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
        <span className="grid min-w-0">
          <span className="truncate font-semibold">{person.displayName}</span>
          <span className="truncate text-small text-text-2">@{person.username}</span>
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {(state === "found" || state === "former") && (
          <motion.div key="add" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <Button fullWidth size="lg" loading={pending} onClick={onAdd}>
              {state === "former" ? copy.addBack : copy.add(groupName)}
            </Button>
          </motion.div>
        )}
        {state === "added" && (
          <motion.div
            key="added"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-tint="green"
            className="flex h-12 items-center justify-center gap-2 rounded-control bg-tint-bg font-semibold text-tint"
          >
            <CheckIn className="inline-grid">
              <Icon name="check" size={18} strokeWidth={2.4} />
            </CheckIn>
            {copy.added}
          </motion.div>
        )}
        {state === "member" && (
          <motion.span
            key="member"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex h-8 items-center gap-1.5 justify-self-start rounded-sm bg-surface-2 px-2.5 text-footnote font-semibold text-text-2"
          >
            <Icon name="check" size={14} strokeWidth={2.4} />
            {copy.already(groupName)}
          </motion.span>
        )}
      </AnimatePresence>
    </Rise>
  );
}
