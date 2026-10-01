"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { askCopy } from "../_data";
import type { ActionSuggestion, Suggestion } from "../_lib/suggest";
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

export interface ActionSuggestionsProps {
  suggestions: readonly ActionSuggestion[];
  onPick: (request: string) => void;
}

export function ActionSuggestions({ suggestions, onPick }: ActionSuggestionsProps) {
  const copy = askCopy.act;
  return (
    <Rise delay={0.2} className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{copy.suggestLabel}</span>
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <Rise key={suggestion.text} delay={0.24 + 0.04 * index}>
            <motion.button
              type="button"
              onClick={() => onPick(suggestion.text)}
              {...pressMotion(true)}
              className="flex min-h-13 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-tile border-[1.5px] border-dashed border-brand bg-bg px-3.5 py-2.5 text-left text-body font-medium text-text transition-colors duration-150 ease-standard hover:bg-brand-tint"
            >
              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-brand-tint text-brand">
                <Icon name={suggestion.icon} size={15} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-[1_1_140px]">{suggestion.text}</span>
              <span className="text-caption font-semibold whitespace-nowrap text-brand">{copy.confirmFirst}</span>
            </motion.button>
          </Rise>
        ))}
      </div>
    </Rise>
  );
}
