"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { Chip } from "@/components/ui/chip";
import { MomentTile } from "@/components/ui/icon-3d";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { Tint } from "@/lib/design-system/tokens";
import { EASE, SPRING_CURVE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";
import type { BillView, CardView, HeadView, MonthBar, RowView, SegmentView, Tone } from "../_lib/view";
import { LeadTile } from "./lead-tile";

export interface AnswerCardProps {
  view: CardView;
  foldable: boolean;
  showFollow: boolean;
  followDisabled: boolean;
  onFold: () => void;
  onAsk: (question: string) => void;
}

const toneTint = { in: "green", out: "red", plain: undefined, muted: undefined } as const satisfies Record<Tone, Tint | undefined>;
const toneClass = { in: "text-tint", out: "text-tint", plain: "text-text", muted: "text-text-2" } as const satisfies Record<Tone, string>;
const MONTH_HEIGHT = 84;

function Heads({ heads, note }: { heads: readonly HeadView[]; note: string | null }) {
  const single = heads.length === 1;
  return (
    <div className="grid gap-2.5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-6 gap-y-4">
        {heads.map((head) => (
          <div key={`${head.caption}-${head.amount}`} className="grid min-w-0 gap-0.5">
            <span className="text-small font-medium text-text-2">{head.caption}</span>
            <span
              data-tint={toneTint[head.tone]}
              className={cn(
                "font-semibold tracking-[-0.03em] whitespace-nowrap",
                toneClass[head.tone],
                head.word ? "text-[min(36px,10vw)]" : single ? "text-[min(44px,12vw)]" : "text-[min(34px,9vw)]",
                "leading-[1.1]",
              )}
            >
              {head.word ? head.amount : <RollingNumber value={head.amount} speed="hero" />}
            </span>
            <span className="text-footnote text-muted">{head.sub}</span>
          </div>
        ))}
      </div>
      {note && (
        <span className="flex items-start gap-2 rounded-control bg-bg px-3 py-2.5 text-footnote text-text-2">
          <Icon name="swap" size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
          {note}
        </span>
      )}
    </div>
  );
}

function Segments({ segments }: { segments: readonly SegmentView[] }) {
  return (
    <div className="grid gap-3">
      <div aria-hidden className="flex h-3 gap-0.75">
        {segments.map((segment, index) => (
          <motion.span
            key={segment.key}
            data-tint={segment.tint}
            style={{ flexGrow: segment.weight, flexBasis: 0 }}
            className="min-w-1.5 origin-left rounded-[4px] bg-tint"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 + index * 0.09 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {segments.map((segment) => (
          <Chip key={segment.key} tint={segment.tint} size="sm" dot className="h-7.5">
            {segment.label}
            <span className="font-medium">{segment.amount}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Months({ months }: { months: readonly MonthBar[] }) {
  return (
    <div className="grid h-35 grid-cols-[repeat(auto-fit,minmax(0,1fr))] items-end gap-2">
      {months.map((month, index) => (
        <div key={month.key} className="grid h-full min-w-0 content-end gap-1.5">
          <span className={cn("truncate text-center text-caption", month.on ? "text-text" : "font-medium text-muted")}>{month.amount}</span>
          <motion.span
            aria-hidden
            data-tint="green"
            style={{ height: Math.max(4, Math.round(month.height * MONTH_HEIGHT)) }}
            className={cn("origin-bottom rounded-sm", month.on ? "bg-tint" : "bg-surface-2")}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 + index * 0.08 }}
          />
          <span className={cn("text-center text-caption", month.on ? "text-text" : "font-medium text-muted")}>{month.label}</span>
        </div>
      ))}
    </div>
  );
}

const rowClass = "-mx-2.5 grid min-h-15 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-control px-2.5 py-2 text-text no-underline";

function Row({ row, index }: { row: RowView; index: number }) {
  const body = (
    <>
      <LeadTile lead={row.lead} />
      <span className="grid min-w-0">
        <span className="truncate font-medium">{row.title}</span>
        <span className="text-footnote text-pretty text-text-2">{row.sub}</span>
      </span>
      <span className="grid justify-items-end gap-px">
        <span data-tint={toneTint[row.tone]} className={cn("font-semibold whitespace-nowrap", toneClass[row.tone])}>
          {row.amount}
        </span>
        {row.run !== "" && <span className="text-caption font-normal whitespace-nowrap text-muted">{row.run}</span>}
      </span>
    </>
  );
  return (
    <motion.div
      className={cn(index > 0 && "border-t border-line")}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: T.t2, ease: EASE, delay: 0.12 + index * 0.05 }}
    >
      {row.href ? (
        <PressLink wide href={row.href} className={cn(rowClass, "transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-text")}>
          {body}
        </PressLink>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </motion.div>
  );
}

function Bill({ bill, index }: { bill: BillView; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: T.t2, ease: EASE, delay: 0.18 + index * 0.05 }}>
      <PressLink
        wide
        href={bill.href}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-tile bg-bg px-3.5 py-3 text-text no-underline transition-shadow duration-150 ease-standard hover:text-text hover:shadow-float"
      >
        <span className="grid min-w-0 gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{bill.title}</span>
            {bill.chip && (
              <Chip tint={bill.chip.tint} size="xs" dot className="h-5.5">
                {bill.chip.label}
              </Chip>
            )}
          </span>
          <span className="text-footnote text-text-2">{bill.meta}</span>
        </span>
        <span className="grid justify-items-end gap-0.5">
          <span className="font-semibold whitespace-nowrap">{bill.total}</span>
          <span className="text-caption font-normal whitespace-nowrap text-muted">{bill.when}</span>
        </span>
      </PressLink>
    </motion.div>
  );
}

export function AnswerCard({ view, foldable, showFollow, followDisabled, onFold, onAsk }: AnswerCardProps) {
  const copy = askCopy;
  const [all, setAll] = useState(false);
  const capped = view.billsCap !== null && view.bills.length > view.billsCap;
  const bills = capped && !all ? view.bills.slice(0, view.billsCap ?? view.bills.length) : view.bills;
  const netTint: Tint | undefined = view.net ? toneTint[view.net.tone] : undefined;

  return (
    <Rise className="grid grid-cols-[minmax(0,1fr)] gap-4.5 rounded-card bg-surface p-5">
      <div className="flex min-h-7 min-w-0 items-center gap-2.5">
        <LeadTile lead={view.eyebrow.lead} size="sm" />
        <span className="min-w-0 flex-1 text-footnote font-semibold text-text-2">{view.eyebrow.text}</span>
        {foldable && (
          <motion.button
            type="button"
            onClick={onFold}
            aria-label={copy.thread.fold}
            aria-expanded
            {...pressMotion()}
            className="-my-2 -mr-2.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-control bg-transparent text-text-2 hover:bg-surface-2"
          >
            <Icon name="chevron-up" size={18} strokeWidth={2} />
          </motion.button>
        )}
      </div>

      {view.heads.length > 0 && <Heads heads={view.heads} note={view.headsNote} />}
      {view.segments.length > 0 && <Segments segments={view.segments} />}
      {view.months.length > 0 && <Months months={view.months} />}

      {view.rows.length > 0 && (
        <div className="grid">
          {view.rowsHead && (
            <div className="flex justify-between gap-3 pb-1.5 text-caption text-muted">
              <span>{view.rowsHead.left}</span>
              <span>{view.rowsHead.right}</span>
            </div>
          )}
          {view.rows.map((row, index) => (
            <Row key={row.key} row={row} index={index} />
          ))}
        </div>
      )}

      {view.net && (
        <Rise
          delay={0.5}
          data-tint={netTint}
          className={cn("flex items-center justify-between gap-3 rounded-tile px-4 py-3", netTint ? "bg-tint-bg text-tint" : "bg-surface-2 text-text")}
        >
          <span className="font-semibold">{view.net.label}</span>
          <span className="text-title whitespace-nowrap">{view.net.amount}</span>
        </Rise>
      )}

      {bills.length > 0 && (
        <div className="grid gap-2">
          {view.billsHead && <span className="text-caption text-muted">{view.billsHead}</span>}
          <div className="grid gap-2">
            {bills.map((bill, index) => (
              <Bill key={bill.key} bill={bill} index={index} />
            ))}
          </div>
          {capped && (
            <motion.button
              type="button"
              onClick={() => setAll((value) => !value)}
              aria-expanded={all}
              {...pressMotion()}
              className="-ml-3 inline-flex h-11 cursor-pointer items-center gap-1.5 justify-self-start rounded-control bg-transparent px-3 text-small font-semibold text-brand hover:bg-brand-tint"
            >
              {all ? copy.spend.showFewer : copy.spend.showAll(view.bills.length)}
              <Icon name={all ? "chevron-up" : "chevron-down"} size={16} strokeWidth={2} />
            </motion.button>
          )}
          {view.more && (
            <PressLink
              href={view.more.href}
              className="-ml-3 inline-flex h-11 items-center gap-1.5 justify-self-start rounded-control px-3 text-small font-semibold text-brand no-underline hover:bg-brand-tint hover:text-brand"
            >
              {view.more.label}
              <Icon name="chevron-right" size={16} strokeWidth={2} />
            </PressLink>
          )}
        </div>
      )}

      {view.note && (
        <div className="flex items-start gap-3.5">
          <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: T.pop, ease: SPRING_CURVE }}>
            <MomentTile icon={view.note.icon} tint={view.note.tint} size="lg" className="size-13 rounded-[16px]" />
          </motion.span>
          <div className="grid min-w-0 gap-1">
            <span className="text-title">{view.note.title}</span>
            <span className="text-small text-pretty text-text-2">{view.note.body}</span>
          </div>
        </div>
      )}

      {view.examples.length > 0 && (
        <div className="grid gap-2">
          {view.examples.map((example, index) => (
            <Rise key={example} delay={0.05 * (index + 1)}>
              <motion.button
                type="button"
                disabled={followDisabled}
                onClick={() => onAsk(example)}
                {...pressMotion(true)}
                className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-tile bg-bg px-3.5 py-2.5 text-left text-body text-text transition-shadow duration-150 ease-standard hover:shadow-float disabled:cursor-not-allowed disabled:text-muted"
              >
                <Icon name="sparkle" size={16} className="shrink-0 text-brand" />
                <span className="min-w-0">{example}</span>
              </motion.button>
            </Rise>
          ))}
        </div>
      )}

      {(view.links.length > 0 || view.asks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {view.links.map((link) => (
            <PressLink
              key={link.href}
              href={link.href}
              className={cn(buttonVariants({ variant: link.primary ? "primary" : "elevated", size: "md" }), "h-11 max-w-full gap-2 px-3.5 text-small font-semibold")}
            >
              <span className="truncate">{link.label}</span>
              <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
            </PressLink>
          ))}
          {view.asks.map((ask) => (
            <motion.button
              key={ask.label}
              type="button"
              disabled={followDisabled}
              onClick={() => onAsk(ask.question)}
              {...pressMotion()}
              className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 max-w-full gap-2 px-3.5 text-small font-semibold")}
            >
              <Icon name="sparkle" size={14} className="shrink-0 text-brand" />
              <span className="truncate">{ask.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-line pt-3.5 text-footnote text-muted">
        <Icon name="receipt" size={14} strokeWidth={2} className="shrink-0" />
        <span>{view.foot}</span>
      </div>

      {showFollow && view.follow.length > 0 && (
        <div className="-mt-1.5 flex flex-wrap gap-2">
          {view.follow.map((question, index) => (
            <Rise key={question} delay={0.65 + index * 0.09} className="max-w-full">
              <motion.button
                type="button"
                disabled={followDisabled}
                onClick={() => onAsk(question)}
                {...pressMotion()}
                className="inline-flex min-h-11 max-w-full cursor-pointer items-center gap-1.5 rounded-[22px] border border-line bg-bg py-2 pr-3.5 pl-3 text-left text-small font-medium text-text transition-colors duration-150 ease-standard hover:border-brand disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-line"
              >
                <Icon name="reply" size={14} strokeWidth={2} className="shrink-0 text-muted" />
                {question}
              </motion.button>
            </Rise>
          ))}
        </div>
      )}
    </Rise>
  );
}
