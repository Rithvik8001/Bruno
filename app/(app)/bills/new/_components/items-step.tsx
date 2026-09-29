"use client";

import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Receipt } from "@/components/ui/receipt";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { BILL_TITLE_MAX } from "@/lib/bills/schema";
import { formatMoney } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { cn } from "@/lib/utils/cn";
import { newBillCopy, type CheckTone } from "../_data";
import { draftTotals, filledItems, itemsCheck, subtotalOf, type ItemsIssue } from "../_lib/derive";
import { addItem, removeItem, updateItem, type BillDraft } from "../_lib/draft";
import { CheckBanner } from "./check-banner";
import { Charges } from "./charges";
import { FlowFooter } from "./flow-footer";
import { itemGridClassName, ItemRow } from "./item-row";
import { StepHeader } from "./step-header";

export interface ItemsStepProps {
  draft: BillDraft;
  onDraft: (update: (draft: BillDraft) => BillDraft) => void;
  onRestore: (draft: BillDraft) => void;
  composer: BillComposer;
  you: PersonId;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

function checkMessage(issue: ItemsIssue | null, unnamed: number): string {
  const check = newBillCopy.items.check;
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

export function ItemsStep({ draft, onDraft, onRestore, composer, you, error, onBack, onNext }: ItemsStepProps) {
  const copy = newBillCopy.items;
  const { toast } = useToast();
  const currency = composer.currency;
  const totals = draftTotals(draft);
  const check = itemsCheck(draft);
  const ready = check.issue === null;
  const tone: CheckTone = ready ? "ok" : "neutral";
  const count = filledItems(draft).length;

  const remove = (key: string, name: string) => {
    const snapshot = draft;
    onDraft((d) => removeItem(d, key));
    toast({
      message: copy.removed(name.trim()),
      icon: "close",
      tint: "neutral",
      action: { label: copy.undo, onAction: () => onRestore(snapshot) },
    });
  };

  return (
    <div className="grid animate-rise gap-6">
      <StepHeader
        back={{ label: copy.back, onBack }}
        status={{ label: ready ? copy.status.ready : copy.status.draft, tone: ready ? "ok" : "neutral" }}
        title={copy.title}
        body={copy.body}
      />

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
        <Select<PersonId>
          label={copy.payer.label}
          value={draft.payerId}
          onValueChange={(payerId) => onDraft((d) => ({ ...d, payerId }))}
          options={composer.members.map((m) => ({
            value: m.id,
            label: m.id === you ? copy.payer.you(m.displayName) : m.displayName,
          }))}
        />
      </div>

      <Receipt bodyClassName="grid px-4 pt-2 pb-4">
        <div className={cn(itemGridClassName, "pt-1.5 pb-2 text-caption font-semibold text-muted")}>
          <span className="px-2.5">{copy.columns.item}</span>
          <span className="text-center">{copy.columns.qty}</span>
          <span className="px-2.5 text-right">{copy.columns.price}</span>
          <span />
        </div>
        {draft.items.map((item) => (
          <ItemRow
            key={item.key}
            item={item}
            currency={currency}
            onChange={(patch) => onDraft((d) => updateItem(d, item.key, patch))}
            onRemove={() => remove(item.key, item.name)}
          />
        ))}
        <button
          type="button"
          onClick={() => onDraft(addItem)}
          className="flex h-11 cursor-pointer items-center gap-2 border-t border-line bg-transparent p-0 text-left text-small font-semibold text-brand hover:text-brand-hover"
        >
          <Icon name="plus" size={16} strokeWidth={2.2} />
          {copy.addItem}
        </button>
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

      <CheckBanner tone={tone}>{checkMessage(check.issue, check.unnamed)}</CheckBanner>
      {error && <InlineAlert>{error}</InlineAlert>}

      <FlowFooter
        action={
          <Button size="lg" disabled={!ready} onClick={onNext} className="min-w-0 gap-2">
            {copy.cta}
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
