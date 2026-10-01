"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import type { AskClarifyQuestion, AskPick } from "@/lib/ask/result";
import { askCopy } from "../_data";
import { clarifyView, type ClarifyLead } from "../_lib/clarify";
import { LeadTile } from "./lead-tile";

export interface ClarifyCardProps {
  questions: readonly AskClarifyQuestion[];
  answered: number;
  onPick: (pick: AskPick, label: string) => void;
  onSkip: () => void;
}

function OptionLead({ lead }: { lead: ClarifyLead }) {
  if (lead.kind === "calendar") {
    return (
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-surface-2 text-text-2">
        <Icon name="calendar" size={16} strokeWidth={1.8} />
      </span>
    );
  }
  if (lead.kind === "amount") {
    return (
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-surface-2 text-body font-semibold text-text-2">
        {lead.symbol}
      </span>
    );
  }
  return <LeadTile lead={lead} size="md" />;
}

export function ClarifyCard({ questions, answered, onPick, onSkip }: ClarifyCardProps) {
  const copy = askCopy.clarify;
  const question = questions[answered];
  if (!question) return null;
  const view = clarifyView(question);
  const multi = questions.length > 1;
  return (
    <Rise key={answered} className="grid gap-4 rounded-card bg-surface p-5">
      <div className="grid gap-1">
        <span className="text-caption text-brand">{multi ? copy.stepOf(answered + 1, questions.length) : copy.step}</span>
        <span className="text-title">{view.title}</span>
        <span className="text-small text-text-2">{view.sub}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {view.options.map((option) => (
          <motion.button
            key={option.pick.ref}
            type="button"
            onClick={() => onPick(option.pick, option.label)}
            {...pressMotion(true)}
            className="flex min-h-15 cursor-pointer items-center gap-2.5 rounded-tile border-[1.5px] border-line bg-bg px-3 py-2 text-left text-text transition-colors duration-150 ease-standard hover:border-brand"
          >
            <OptionLead lead={option.lead} />
            <span className="grid min-w-0">
              <span className="truncate font-semibold">{option.label}</span>
              {option.sub !== "" && <span className="text-caption font-normal text-text-2">{option.sub}</span>}
            </span>
          </motion.button>
        ))}
      </div>
      <Button variant="tertiary" size="md" onClick={onSkip} className="-ml-3 h-11 justify-self-start px-3 text-small hover:bg-surface-2">
        {multi && answered < questions.length - 1 ? copy.skipAll : copy.skip}
      </Button>
    </Rise>
  );
}
