"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Receipt } from "@/components/ui/receipt";
import { RollingNumber } from "@/components/ui/rolling-number";
import { SOFT_SPRING } from "@/lib/motion/tokens";
import { currencySymbol, formatAmount, formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { composerCopy } from "../data";
import { claimView } from "../lib/derive";
import { claimRest, toggleClaim, type BillDraft } from "../lib/draft";
import { shortName, type Roster } from "../lib/people";
import { ClaimRow } from "./claim-row";
import { FlowFooter } from "./flow-footer";
import { PersonPicker } from "./person-picker";
import { StepHeader } from "./step-header";

export interface ClaimStepProps {
  draft: BillDraft;
  onDraft: (update: (draft: BillDraft) => BillDraft) => void;
  composer: BillComposer;
  roster: Roster;
  memberIds: readonly PersonId[];
  you: PersonId;
  dateLabel: string;
  error: string | null;
  pending: boolean;
  cta: string;
  onBack: () => void;
  onEditor: () => void;
  onLive: (() => void) | null;
  livePending: boolean;
  onFinish: () => void;
}

export function ClaimStep({
  draft,
  onDraft,
  composer,
  roster,
  memberIds,
  you,
  dateLabel,
  error,
  pending,
  cta,
  onBack,
  onEditor,
  onLive,
  livePending,
  onFinish,
}: ClaimStepProps) {
  const copy = composerCopy.claim;
  const currency = composer.currency;
  const [selected, setSelected] = useState<PersonId>(you);
  const view = claimView(draft);
  const share = view.shareOf(selected);
  const name = shortName(selected, roster, you, copy.you);
  const payer = shortName(draft.payerId, roster, you, copy.you.toLowerCase());
  const progress = view.lines.length === 0 ? 0 : Math.round((view.claimed / view.lines.length) * 100);

  return (
    <div className="grid gap-5">
      <StepHeader
        back={{ label: copy.back, onBack }}
        status={{
          label: view.ready ? copy.status.ready : copy.status.progress(view.claimed, view.lines.length),
          tone: view.ready ? "ok" : "pending",
        }}
        title={copy.title}
        body={copy.body}
      />

      <PersonPicker members={composer.members} roster={roster} you={you} value={selected} onValueChange={setSelected} />

      <Receipt bodyClassName="grid px-4 pt-2 pb-4">
        <div className="flex items-center justify-between gap-3 pt-1.5 pb-2.5">
          <span className="grid min-w-0">
            <span className="truncate font-semibold">{draft.title}</span>
            <span className="text-caption font-normal text-muted">{copy.paidBy(dateLabel, payer)}</span>
          </span>
          <span
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={copy.status.progress(view.claimed, view.lines.length)}
            className="h-1.5 w-30 shrink-0 overflow-hidden rounded-full bg-surface-2"
          >
            <motion.span
              className="block h-full origin-left rounded-full bg-brand"
              initial={false}
              animate={{ scaleX: progress / 100 }}
              transition={SOFT_SPRING}
            />
          </span>
        </div>
        {view.lines.map((line) => (
          <ClaimRow
            key={line.key}
            line={line}
            selected={selected}
            roster={roster}
            you={you}
            currency={currency}
            onToggle={() => onDraft((d) => toggleClaim(d, line.key, selected))}
          />
        ))}
        <div className="mt-1 grid gap-1 border-t border-border pt-3 text-small text-text-2">
          <div className="flex justify-between gap-3">
            <span>{copy.extras(draft.discount !== null && draft.discount > 0)}</span>
            <span>{formatAmount(view.extras, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{copy.extrasShare(name)}</span>
            <span>{formatAmount(share.extras, currency)}</span>
          </div>
        </div>
      </Receipt>

      <AnimatePresence initial={false}>
        {view.unclaimedKeys.length > 0 && (
          <Rise key="unclaimed" className="flex items-center gap-3 rounded-tile bg-surface py-3.5 pr-2 pl-4 text-small">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {copy.unclaimed(view.unclaimedKeys.length, formatMoney(view.unclaimedTotal, currency))}
              </span>
              <span className="block text-footnote text-text-2">{copy.unclaimedBody}</span>
            </span>
            <Button
              variant="elevated"
              size="sm"
              onClick={() => onDraft((d) => claimRest(d, view.unclaimedKeys, memberIds))}
            >
              {copy.splitRest}
            </Button>
          </Rise>
        )}
      </AnimatePresence>

      {onLive && (
        <motion.button
          type="button"
          onClick={onLive}
          disabled={livePending}
          aria-busy={livePending || undefined}
          {...pressMotion(true)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-left text-small transition-colors duration-150 ease-standard hover:bg-surface-2 aria-busy:cursor-progress"
        >
          <span data-tint="cyan" className="grid size-8 shrink-0 place-items-center rounded-control bg-tint-bg text-tint">
            <Icon name="link" size={16} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{copy.live.title}</span>
            <span className="block text-footnote text-text-2">{livePending ? copy.live.saving : copy.live.body}</span>
          </span>
          {livePending ? (
            <Spinner className="size-4 shrink-0 text-brand" />
          ) : (
            <Icon name="chevron-right" size={18} className="text-muted" />
          )}
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={onEditor}
        {...pressMotion(true)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-left text-small transition-colors duration-150 ease-standard hover:bg-surface-2"
      >
        <span data-tint="indigo" className="grid size-8 shrink-0 place-items-center rounded-control bg-tint-bg text-tint">
          <Icon name="align-left" size={16} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{copy.editor.title}</span>
          <span className="block text-footnote text-text-2">{copy.editor.body}</span>
        </span>
        <Icon name="chevron-right" size={18} className="text-muted" />
      </motion.button>

      {error && <InlineAlert>{error}</InlineAlert>}

      <FlowFooter
        action={
          <Button size="lg" disabled={!view.ready} loading={pending} onClick={onFinish}>
            {cta}
          </Button>
        }
      >
        <span className="text-footnote text-text-2">{copy.shareLabel(name)}</span>
        <span className="flex text-title font-semibold">
          <span>{currencySymbol(currency)}</span>
          <RollingNumber speed="live" value={formatAmount(share.total, currency, "never")} />
        </span>
      </FlowFooter>
    </div>
  );
}
