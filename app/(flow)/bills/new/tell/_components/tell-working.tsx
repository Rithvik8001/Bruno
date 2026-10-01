"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { Rise, StepSwap } from "@/components/motion/rise";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/ui/receipt";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { EASE, T } from "@/lib/motion/tokens";
import type { PersonView } from "@/lib/people/person";
import type { TellResult } from "@/lib/tell/result";
import { cn } from "@/lib/utils/cn";
import { tellCopy } from "../_data";
import {
  chunksOf,
  chunkState,
  creepStage,
  GHOST_WIDTHS,
  lineShown,
  previewLines,
  previewTotal,
  totalShown,
  type ChunkState,
} from "../_lib/phase";

export interface TellWorkingProps {
  text: string;
  group: string;
  currency: CurrencyCode;
  members: readonly PersonView[];
  creep: number | null;
  reveal: number | null;
  result: TellResult | null;
  onCancel: (() => void) | null;
}

const FADE = { duration: T.t3, ease: EASE } as const;
const PRINT = { duration: 0.45, ease: EASE } as const;
const FACES_MAX = 4;

const chunkClass = {
  idle: "bg-transparent text-text",
  now: "bg-brand-tint text-brand",
  done: "bg-green-bg text-green",
} as const satisfies Record<ChunkState, string>;

export function TellWorking({ text, group, currency, members, creep, reveal, result, onCancel }: TellWorkingProps) {
  const copy = tellCopy.working;
  const chunks = chunksOf(text);
  const lines = result ? previewLines(result, members) : [];
  const rows = result ? lines : GHOST_WIDTHS.slice(0, 2).map((_, index) => ({ id: `ghost-${index}`, name: "", price: null, people: [] }));
  const total = result ? previewTotal(result) : null;
  const money = total === null ? null : formatMoney(total, currency);
  const ready = result !== null && totalShown(reveal);
  const stage = creepStage(creep);
  const caption =
    result === null
      ? stage === "matching"
        ? copy.captions.matching(group)
        : copy.captions[stage]
      : ready
        ? copy.captions.ready(result.items.length, money)
        : copy.captions.found(result.title ?? result.items[0]?.name ?? group, money);
  const captionKey = result === null ? stage : ready ? "ready" : "found";

  return (
    <Rise className="grid gap-5">
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{copy.title}</h1>
        <p className="m-0 text-text-2">{copy.body}</p>
      </div>

      <div className="grid gap-1.5 rounded-card bg-surface p-4">
        <span className="text-caption font-semibold text-muted">{copy.said}</span>
        <p className="m-0 text-lead leading-7 wrap-anywhere">
          {chunks.map((chunk, index) => (
            <span key={index}>
              <span
                className={cn(
                  "-mx-px rounded-[5px] box-decoration-clone px-0.75 py-0.5 transition-[background-color,color] duration-300 ease-standard",
                  chunkClass[chunkState(index, chunks.length, creep, result !== null)],
                )}
              >
                {chunk.text}
              </span>
              {chunk.separator}
            </span>
          ))}
        </p>
      </div>

      <Receipt className="max-w-100 justify-self-center" bodyClassName="px-5 pt-3.5 pb-4">
        <div className="mb-2 flex min-h-7 items-center justify-between gap-3">
          {result?.title ? (
            <motion.span className="truncate font-semibold" initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={FADE}>
              {result.title}
            </motion.span>
          ) : (
            <span aria-hidden className="h-2.5 w-16 rounded-full bg-surface-2" />
          )}
          <span
            data-tint={ready ? "green" : "brand"}
            aria-live="polite"
            className="inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-[7px] bg-tint-bg pr-2.25 pl-1.75 text-caption text-tint transition-colors duration-220"
          >
            <Icon name="sparkle" size={12} />
            {ready ? copy.chip.ready : copy.chip.drafting}
          </span>
        </div>

        {rows.map((row, index) => {
          const on = result !== null && lineShown(index, rows.length, reveal);
          return (
            <div key={row.id} className="relative flex min-h-11 items-center justify-between gap-3 border-t border-line">
              <motion.span
                aria-hidden
                className="absolute top-[calc(50%-5px)] left-0 h-2.5 rounded-full bg-surface-2"
                style={{ width: GHOST_WIDTHS[index % GHOST_WIDTHS.length] }}
                initial={false}
                animate={{ opacity: on ? 0 : 1 }}
                transition={FADE}
              />
              <motion.span
                className="flex min-w-0 items-center gap-2"
                initial={false}
                animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                transition={PRINT}
              >
                <span className="truncate text-small font-medium">{row.name}</span>
                {row.people.length > 0 && (
                  <span className="flex shrink-0 pl-1.5">
                    {row.people.slice(0, FACES_MAX).map((person) => (
                      <Avatar
                        key={person.id}
                        name={person.displayName}
                        tint={person.tint}
                        buddy={person.buddy}
                        size="sm"
                        className="-ml-1.5 size-5 ring-2 ring-surface"
                      />
                    ))}
                  </span>
                )}
              </motion.span>
              <motion.span
                className="shrink-0 text-small font-semibold whitespace-nowrap"
                initial={false}
                animate={on ? { opacity: 1 } : { opacity: 0 }}
                transition={{ ...PRINT, delay: on ? 0.08 : 0 }}
              >
                {row.price === null ? "—" : formatMoney(row.price, currency)}
              </motion.span>
            </div>
          );
        })}

        <div className="mt-1 flex min-h-11 items-center justify-between border-t border-border">
          <motion.span className="font-semibold" initial={false} animate={{ opacity: ready ? 1 : 0.25 }} transition={FADE}>
            {copy.total}
          </motion.span>
          <motion.span className="text-lead font-semibold" initial={false} animate={{ opacity: ready ? 1 : 0.25 }} transition={FADE}>
            {money ?? "—"}
          </motion.span>
        </div>
      </Receipt>

      <div className="min-h-11">
        <StepSwap stepKey={captionKey} className="grid justify-items-center gap-1 text-center">
          <span className="font-semibold">{caption[0]}</span>
          <span className="text-small text-text-2">{caption[1]}</span>
        </StepSwap>
      </div>

      {onCancel && (
        <Button variant="tertiary" size="md" onClick={onCancel} className="h-11 justify-self-center">
          {copy.cancel}
        </Button>
      )}
    </Rise>
  );
}
