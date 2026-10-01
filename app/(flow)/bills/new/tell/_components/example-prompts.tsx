"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { tellCopy } from "../_data";

export interface ExamplePromptsProps {
  examples: readonly string[];
  onPick: (example: string) => void;
}

export function ExamplePrompts({ examples, onPick }: ExamplePromptsProps) {
  return (
    <Rise className="grid gap-2">
      <span className="text-footnote font-medium text-text-2">{tellCopy.compose.examplesLabel}</span>
      <div className="grid gap-2">
        {examples.map((example, index) => (
          <Rise key={example} delay={0.04 * (index + 1)}>
            <motion.button
              type="button"
              onClick={() => onPick(example)}
              {...pressMotion(true)}
              className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-tile bg-surface px-3.5 py-2.5 text-left text-body text-text transition-colors duration-150 ease-standard hover:bg-surface-2"
            >
              <Icon name="lines" size={16} strokeWidth={2} className="shrink-0 text-muted" />
              <span className="min-w-0">{example}</span>
            </motion.button>
          </Rise>
        ))}
      </div>
    </Rise>
  );
}
