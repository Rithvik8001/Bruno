"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Receipt } from "@/components/ui/receipt";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { BILL_TITLE_MAX } from "@/lib/bills/schema";
import { formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { cn } from "@/lib/utils/cn";
import { composerCopy, type CheckTone } from "../data";
import { draftTotals, filledItems, itemsCheck, subtotalOf, type ItemsIssue } from "../lib/derive";
import { addItem, removeItem, updateItem, type BillDraft } from "../lib/draft";
import { dayLabel } from "../lib/format";
import { flaggedCount, receiptCheck, type ReceiptCheck, type ScanReceipt } from "../lib/scan";
import { confirmPayer, guessCount, isUnpriced, saidCheck, unpricedCount } from "../lib/tell";
import { CheckBanner } from "./check-banner";
import { Charges } from "./charges";
import { DuplicateBanner } from "./duplicate-banner";
import { FlowFooter } from "./flow-footer";
import { itemGridClassName, ItemRow, type ItemNote } from "./item-row";
import { StepHeader } from "./step-header";

const PRINT_STEP_MS = 260;

export interface ItemsStepProps {
  draft: BillDraft;
  onDraft: (update: (draft: BillDraft) => BillDraft) => void;
  onRestore: (draft: BillDraft) => void;
  composer: BillComposer;
  you: PersonId;
  scan: ScanReceipt | null;
  told: boolean;
  banner?: ReactNode;
  today: string;
  error: string | null;
  modeCopy: ItemsModeCopy;
  cta: string;
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
}

export interface ItemsModeCopy {
  readonly back: string;
  readonly itemsTitle: string;
  readonly itemsBody: string;
}

function checkMessage(issue: ItemsIssue | null, unnamed: number): string {
  const check = composerCopy.items.check;
  switch (issue) {
    case null:
      return check.ok;
    case "noItems":
      return check.noItems;
    case "unnamed":
      return check.unnamed(unnamed);
    case "discount":
      return check.discount;
    case "noTitle":
      return check.noTitle;
  }
}

function saidMessage(check: ReceiptCheck, currency: BillComposer["currency"]): string | null {
  const copy = composerCopy.items.check;
  switch (check.kind) {
    case "unresolved":
      return copy.saidUnpriced(check.count);
    case "match":
      return copy.saidMatch(formatMoney(check.total, currency));
    case "off":
      return copy.saidOff(formatMoney(check.total, currency), formatMoney(check.printed, currency), formatMoney(check.diff, currency));
    case "printing":
    case "plain":
      return null;
  }
}

function receiptMessage(check: ReceiptCheck, currency: BillComposer["currency"]): string | null {
  const copy = composerCopy.items.check;
  switch (check.kind) {
    case "printing":
      return copy.printing;
    case "unresolved":
      return check.printed === null ? copy.unresolved(check.count) : copy.receiptUnresolved(formatMoney(check.printed, currency), check.count);
    case "match":
      return copy.receiptMatch(formatMoney(check.total, currency));
    case "off":
      return copy.receiptOff(formatMoney(check.total, currency), formatMoney(check.printed, currency), formatMoney(check.diff, currency));
    case "plain":
      return null;
  }
}

function usePrintIn(total: number, enabled: boolean): number {
  const [shown, setShown] = useState(enabled ? 0 : Number.POSITIVE_INFINITY);
  useEffect(() => {
    if (!enabled || shown >= total) return;
    const timer = setTimeout(() => setShown((n) => n + 1), PRINT_STEP_MS);
    return () => clearTimeout(timer);
  }, [enabled, shown, total]);
  return shown;
}

export function ItemsStep({
  draft,
  onDraft,
  onRestore,
  composer,
  you,
  scan,
  told,
  banner,
  today,
  error,
  modeCopy,
  cta,
  pending,
  onBack,
  onNext,
}: ItemsStepProps) {
  const copy = composerCopy.items;
  const { toast } = useToast();
  const currency = composer.currency;
  const totals = draftTotals(draft);
  const check = itemsCheck(draft);
  const count = filledItems(draft).length;
  const sourced = scan !== null || told;
  const shown = usePrintIn(draft.items.length, sourced);
  const printing = sourced && shown < draft.items.length;
  const flagged = scan !== null ? flaggedCount(draft) : told ? unpricedCount(draft) : 0;
  const guesses = told ? guessCount(draft) : 0;
  const ready = !printing && flagged === 0 && check.issue === null;
  const receipt = scan !== null ? receiptCheck(draft, scan.printedTotal, printing) : told ? saidCheck(draft, printing) : null;
  const receiptText = receipt === null ? null : told ? saidMessage(receipt, currency) : receiptMessage(receipt, currency);
  const marks = draft.marks;
  const noteFor = (item: BillDraft["items"][number]): ItemNote | null =>
    !told
      ? null
      : isUnpriced(item)
        ? { kind: "unpriced" }
        : marks?.restKey === item.key && marks.stated !== null
          ? { kind: "rest", label: copy.told.rest(formatMoney(marks.stated, currency)) }
          : null;
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const duplicate = scan?.duplicate ?? null;

  const status: { label: string; tone: CheckTone } = printing
    ? { label: copy.status.reading, tone: "reading" }
    : guesses > 0
      ? { label: copy.status.guesses(guesses), tone: "pending" }
      : flagged > 0
        ? { label: copy.status.toCheck(flagged), tone: "pending" }
        : ready
        ? { label: copy.status.ready, tone: "ok" }
        : { label: copy.status.draft, tone: "neutral" };

  const bannerTone: CheckTone = ready ? "ok" : receipt?.kind === "off" ? "pending" : "neutral";
  const bannerText = receiptText ?? checkMessage(check.issue, check.unnamed);

  const remove = (key: string, name: string) => {
    const snapshot = draft;
    onDraft((d) => removeItem(d, key));
    toast({
      message: copy.removed(name.trim()),
      action: { label: copy.undo, onAction: () => onRestore(snapshot) },
    });
  };

  return (
    <div className="grid gap-6">
      <StepHeader
        back={{ label: modeCopy.back, onBack }}
        status={status}
        title={modeCopy.itemsTitle}
        body={modeCopy.itemsBody}
        banner={banner}
      />

      {duplicate && !duplicateDismissed && !printing && (
        <DuplicateBanner
          duplicate={duplicate}
          dayLabel={dayLabel(duplicate.occurredOn, today, composerCopy.today)}
          onDismiss={() => setDuplicateDismissed(true)}
        />
      )}
      {scan?.currencyMismatch && <InlineAlert tint="amber">{copy.currencyMismatch(composer.name, currency)}</InlineAlert>}

      <div className="grid gap-2.5">
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <TextField
            label={copy.place.label}
            placeholder={copy.place.placeholder}
            value={draft.title}
            maxLength={BILL_TITLE_MAX}
            autoComplete="off"
            onChange={(e) => onDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <TextField
            label={copy.date.label}
            type="date"
            fieldClassName="min-w-0"
            className="min-w-0"
            value={draft.occurredOn}
            suppressHydrationWarning
            onChange={(e) => onDraft((d) => ({ ...d, occurredOn: e.target.value || d.occurredOn }))}
          />
        </div>
        <div
          data-tint="amber"
          className={cn(
            "grid gap-2 rounded-tile transition-[background-color,padding,margin] duration-220 ease-standard",
            marks?.payerGuessed && "-mx-3 bg-tint-bg px-3 pt-2.5 pb-3",
          )}
        >
          <Select<PersonId>
            label={copy.payer.label}
            value={draft.payerId}
            onValueChange={(payerId) => onDraft((d) => ({ ...d, payerId }))}
            className={cn(marks?.payerGuessed && "bg-bg hover:bg-bg")}
            options={composer.members.map((m) => ({
              value: m.id,
              label: m.id === you ? copy.payer.you(m.displayName) : m.displayName,
            }))}
          />
          {marks?.payerGuessed && (
            <div className="flex flex-wrap items-center gap-2 text-footnote font-semibold text-tint">
              <Icon name="sparkle" size={14} className="shrink-0" />
              <span className="min-w-40 flex-1">{copy.told.payerGuess}</span>
              <Button variant="elevated" size="sm" onClick={() => onDraft(confirmPayer)} className="pointer-coarse:h-11">
                {copy.told.payerKeep}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Receipt bodyClassName="grid px-4 pt-2 pb-4">
        <div className={cn(itemGridClassName, "pt-1.5 pb-2 text-caption font-semibold text-muted")}>
          <span className="px-2.5">{copy.columns.item}</span>
          <span className="text-center">{copy.columns.qty}</span>
          <span className="px-2.5 text-right">{copy.columns.price}</span>
          <span />
        </div>
        <AnimatePresence initial={false}>
          {draft.items.slice(0, shown).map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              note={noteFor(item)}
              currency={currency}
              onChange={(patch) => onDraft((d) => updateItem(d, item.key, patch))}
              onRemove={() => remove(item.key, item.name)}
            />
          ))}
        </AnimatePresence>
        {printing && (
          <div className="flex min-h-11 items-center gap-2 border-t border-line text-small text-muted">
            <Spinner className="size-3.5" label={copy.status.reading} />
            {copy.status.reading}…
          </div>
        )}
        <motion.button
          type="button"
          onClick={() => onDraft(addItem)}
          {...pressMotion(true)}
          className="flex h-11 origin-left cursor-pointer items-center gap-2 border-t border-line bg-transparent p-0 text-left text-small font-semibold text-brand hover:text-brand-hover"
        >
          <Icon name="plus" size={16} strokeWidth={2.2} />
          {copy.addItem}
        </motion.button>
        <Charges
          draft={draft}
          subtotal={subtotalOf(draft)}
          totals={totals}
          currency={currency}
          onTax={(tax) => onDraft((d) => ({ ...d, tax }))}
          onTip={(tip) => onDraft((d) => ({ ...d, tip }))}
          onDiscount={(discount) => onDraft((d) => ({ ...d, discount }))}
        />
      </Receipt>

      {told && count === 1 && !printing && <p className="m-0 text-small text-text-2">{copy.told.single}</p>}
      <CheckBanner tone={bannerTone}>{bannerText}</CheckBanner>
      {error && <InlineAlert>{error}</InlineAlert>}

      <FlowFooter
        action={
          <Button size="lg" disabled={!ready} loading={pending} onClick={onNext} className="min-w-0 gap-2">
            {cta}
            <Icon name="arrow-right" size={18} strokeWidth={2} />
          </Button>
        }
      >
        <span className="font-semibold">{totals ? formatMoney(totals.total, currency) : copy.noTotal}</span>
        <span className="truncate text-footnote text-text-2">{copy.footer(count, composer.name)}</span>
      </FlowFooter>
    </div>
  );
}
