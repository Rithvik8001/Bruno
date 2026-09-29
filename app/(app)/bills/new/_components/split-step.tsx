"use client";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Tabs } from "@/components/ui/segmented-control";
import { Stepper } from "@/components/ui/stepper";
import { currencySymbol, formatMoney, type CurrencyCode } from "@/lib/currency";
import type { PersonId } from "@/lib/domain/ids";
import type { BillComposer } from "@/lib/groups/queries";
import { negateCents } from "@/lib/money";
import { newBillCopy, SHARES_RANGE, SPLIT_TABS, type CheckTone, type SplitTab } from "../_data";
import { splitView, type SplitCheck } from "../_lib/derive";
import { fillRemainder, personIn, updatePerson, type BillDraft, type SplitPerson } from "../_lib/draft";
import { shortName, type Roster } from "../_lib/people";
import { CheckBanner } from "./check-banner";
import { FlowFooter } from "./flow-footer";
import { SplitPersonRow } from "./split-person-row";
import { StepHeader } from "./step-header";

export interface SplitStepProps {
  draft: BillDraft;
  onDraft: (update: (draft: BillDraft) => BillDraft) => void;
  composer: BillComposer;
  roster: Roster;
  memberIds: readonly PersonId[];
  you: PersonId;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onSave: () => void;
}

const PERCENT_MAX = 100;

const copy = newBillCopy.split;

function statusOf(check: SplitCheck, currency: CurrencyCode): { label: string; tone: CheckTone } {
  switch (check.kind) {
    case "ok":
      return { label: copy.status.ok, tone: "ok" };
    case "nobody":
      return { label: copy.status.nobody, tone: "pending" };
    case "percent":
      return { label: copy.status.percent(check.assigned), tone: "pending" };
    case "amount":
      return {
        label:
          check.difference > 0
            ? copy.status.left(formatMoney(check.difference, currency))
            : copy.status.over(formatMoney(negateCents(check.difference), currency)),
        tone: "pending",
      };
  }
}

function checkText(check: SplitCheck, included: number, total: string, currency: CurrencyCode): string {
  switch (check.kind) {
    case "ok":
      return copy.check.ok(included, total);
    case "nobody":
      return copy.check.nobody;
    case "percent":
      return check.assigned < PERCENT_MAX
        ? copy.check.percentLeft(check.assigned, PERCENT_MAX - check.assigned)
        : copy.check.percentOver(check.assigned, check.assigned - PERCENT_MAX);
    case "amount":
      return check.difference > 0
        ? copy.check.amountLeft(formatMoney(check.difference, currency))
        : copy.check.amountOver(formatMoney(negateCents(check.difference), currency));
  }
}

function PercentField({ value, label, onValueChange }: { value: number | null; label: string; onValueChange: (value: number | null) => void }) {
  return (
    <span className="inline-flex h-9 items-center rounded-sm bg-bg pr-2.5 pl-1">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={value === null ? "" : String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
          onValueChange(digits === "" ? null : Math.min(PERCENT_MAX, Number(digits)));
        }}
        className="h-8 w-11 border-0 bg-transparent p-0 text-right text-small font-semibold outline-none"
      />
      <span className="text-footnote font-semibold text-muted">%</span>
    </span>
  );
}

export function SplitStep({ draft, onDraft, composer, roster, memberIds, you, error, pending, onBack, onSave }: SplitStepProps) {
  const currency = composer.currency;
  const view = splitView(draft, memberIds);
  const status = statusOf(view.check, currency);
  const total = formatMoney(view.total, currency);
  const set = (id: PersonId, patch: Partial<SplitPerson>) => onDraft((d) => updatePerson(d, id, patch));

  const canFix =
    (draft.method === "AMOUNT" && view.check.kind === "amount" && view.check.difference > 0) ||
    (draft.method === "PERCENT" && view.check.kind === "percent" && view.check.assigned < PERCENT_MAX);
  const fixLabel = draft.method === "AMOUNT" ? copy.fix.AMOUNT : copy.fix.PERCENT;

  return (
    <div className="grid animate-rise gap-5">
      <StepHeader
        back={{ label: copy.back, onBack }}
        status={{ ...status, pop: view.check.kind === "ok" }}
        title={copy.title}
        body={copy.body(total, draft.title.trim())}
      />

      <div className="grid gap-3">
        <Tabs<SplitTab>
          label={copy.methodsLabel}
          value={draft.method}
          onValueChange={(method) => onDraft((d) => ({ ...d, method }))}
          options={SPLIT_TABS.map((method) => ({ value: method, label: copy.methods[method] }))}
          className="flex w-full [&>button]:flex-1"
        />
        <p className="m-0 text-footnote text-muted">{copy.hints[draft.method]}</p>
      </div>

      <div className="grid rounded-card bg-surface px-4 py-1">
        {composer.members.map((person) => {
          const id = person.id;
          const p = personIn(draft, id);
          const name = shortName(id, roster, you, newBillCopy.claim.you);
          const personTotal = view.totals.get(id);
          const control =
            draft.method === "SHARES" ? (
              <Stepper
                size="sm"
                label={copy.shares(name)}
                value={p.shares}
                min={SHARES_RANGE.min}
                max={SHARES_RANGE.max}
                onValueChange={(shares) => set(id, { shares })}
              />
            ) : draft.method === "PERCENT" ? (
              <PercentField value={p.percent} label={copy.percent(name)} onValueChange={(percent) => set(id, { percent })} />
            ) : draft.method === "AMOUNT" ? (
              <span className="inline-flex h-9 items-center rounded-sm bg-bg pr-1 pl-2.5">
                <span className="text-footnote font-semibold text-muted">{currencySymbol(currency)}</span>
                <AmountInput
                  value={p.amount}
                  onValueChange={(amount) => set(id, { amount })}
                  currency={currency}
                  aria-label={copy.amount(name)}
                  className="h-8 w-18 px-1 hover:bg-transparent focus:border-transparent"
                />
              </span>
            ) : null;
          return (
            <SplitPersonRow
              key={id}
              person={person}
              name={name}
              caption={id === draft.payerId ? copy.inCaption.payer : copy.inCaption.member}
              included={p.included}
              total={personTotal === undefined ? null : formatMoney(personTotal, currency)}
              onToggle={() => set(id, { included: !p.included })}
              control={control}
            />
          );
        })}
      </div>

      <CheckBanner
        tone={status.tone}
        action={
          canFix
            ? { label: fixLabel, onAction: () => onDraft((d) => fillRemainder(d, memberIds, you, view.total)) }
            : undefined
        }
      >
        {checkText(view.check, view.included, total, currency)}
      </CheckBanner>

      {error && <InlineAlert>{error}</InlineAlert>}

      <FlowFooter
        action={
          <Button size="lg" disabled={view.check.kind !== "ok"} loading={pending} onClick={onSave}>
            {copy.cta}
          </Button>
        }
      >
        <span className="text-footnote text-text-2">{copy.assigned}</span>
        <span className="text-title font-semibold">
          {formatMoney(view.assigned, currency)}{" "}
          <span className="text-small font-medium text-muted">{copy.of(total)}</span>
        </span>
      </FlowFooter>
    </div>
  );
}
