"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import type { Suggestion } from "../_lib/suggest";
import { LeadTile } from "./lead-tile";

export interface SuggestionsProps {
  label: string;
  suggestions: readonly Suggestion[];
  onPick: (question: string) => void;
}

export function Suggestions({ label, suggestions, onPick }: SuggestionsProps) {
  return (
    <Rise className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{label}</span>
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <Rise key={suggestion.text} delay={0.04 * (index + 1)}>
            <motion.button
              type="button"
              onClick={() => onPick(suggestion.text)}
              {...pressMotion(true)}
              className="flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-tile bg-surface px-3.5 py-2.5 text-left text-body text-text transition-colors duration-150 ease-standard hover:bg-surface-2"
            >
              <LeadTile lead={suggestion.lead} size="sm" />
              <span className="min-w-0 flex-1">{suggestion.text}</span>
              <Icon name="chevron-right" size={16} strokeWidth={2} className="shrink-0 text-muted" />
            </motion.button>
          </Rise>
        ))}
      </div>
    </Rise>
  );
}
