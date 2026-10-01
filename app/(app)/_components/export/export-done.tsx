"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { EASE, SPRING_CURVE, T } from "@/lib/motion/tokens";
import { exportCopy } from "./_data";
import type { ExportedFile } from "./_lib/download";
import { fileSize } from "./_lib/summary";

const DRAW_DELAY = 0.18;

export function ExportDoneTitle() {
  return (
    <span className="grid justify-items-start gap-4">
      <motion.span
        aria-hidden
        data-tint="green"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: T.pop, ease: SPRING_CURVE }}
        className="grid size-12 place-items-center rounded-full bg-tint-bg text-tint"
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: T.t3, ease: EASE, delay: DRAW_DELAY }}
          />
        </svg>
      </motion.span>
      {exportCopy.done.title}
    </span>
  );
}

export function ExportDone({ file }: { file: ExportedFile }) {
  const copy = exportCopy.done;
  const detail = file.files > 1 ? copy.filesInside(file.files) : copy.rows(file.rows);

  return (
    <Rise className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-tile bg-surface p-3">
      <span aria-hidden className="grid size-10 place-items-center rounded-[12px] bg-bg text-text-2">
        <Icon name="file" size={20} />
      </span>
      <span className="grid min-w-0">
        <span className="text-small font-semibold wrap-anywhere">{file.name}</span>
        <span className="text-footnote text-text-2">{`${fileSize(file.blob.size)} · ${detail}`}</span>
      </span>
    </Rise>
  );
}
