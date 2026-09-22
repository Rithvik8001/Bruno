import { useRef, useState } from "react";
import { View } from "react-native";

import {
  DateField,
  Disclosure,
  Gap,
  Input,
  SelectField,
  Spacer,
  T,
  ToggleRow,
  layout,
  type InputRef,
  type SelectOption,
} from "@/design";
import {
  toLocalDate,
  type BillingCycle,
  type CalendarDate,
} from "@/lib/calendar";
import { currencySymbol, parseAmount } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import {
  customCycle,
  draftInput,
  noCategory,
  type CategoryChoice,
  type CycleChoice,
  type SubscriptionDraft,
} from "../form";
import { formatCycle } from "../format";
import {
  categories,
  cyclePresetFor,
  cyclePresets,
  type NewSubscription,
} from "../types";
import {
  looksLikeCardNumber,
  nameMaxLength,
  notesMaxLength,
  paymentMethodMaxLength,
  renewalHorizon,
} from "../validation";

const copy = subscriptionsCopy.form;

const presetOptions: readonly SelectOption<CycleChoice>[] = cyclePresets.map(
  (preset) => ({ value: preset, label: subscriptionsCopy.cycles[preset] }),
);

const categoryOptions: readonly SelectOption<CategoryChoice>[] = [
  { value: noCategory, label: copy.categoryNone },
  ...categories.map((category) => ({
    value: category,
    label: subscriptionsCopy.categories[category],
  })),
];

export type SubscriptionFormOptions = {
  initial: SubscriptionDraft;
  start: CalendarDate;
  currency: string | null;
  baseCycle?: BillingCycle;
  initiallyExpanded?: boolean;
};

export type SubscriptionForm = {
  draft: SubscriptionDraft;
  set: <K extends keyof SubscriptionDraft>(
    key: K,
    value: SubscriptionDraft[K],
  ) => void;
  input: NewSubscription | null;
  amountError: string | undefined;
  blurAmount: () => void;
  expanded: boolean;
  toggleExpanded: () => void;
  cycleOptions: readonly SelectOption<CycleChoice>[];
  start: CalendarDate;
  currency: string | null;
};

export function useSubscriptionForm({
  initial,
  start,
  currency,
  baseCycle,
  initiallyExpanded = false,
}: SubscriptionFormOptions): SubscriptionForm {
  const [draft, setDraft] = useState(initial);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const set: SubscriptionForm["set"] = (key, value) => {
    if (key === "amount") {
      setAmountError(undefined);
    }
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const blurAmount = () => {
    if (
      currency !== null &&
      draft.amount.trim().length > 0 &&
      parseAmount(draft.amount, currency) === null
    ) {
      setAmountError(subscriptionsCopy.errors.amountInvalid);
    }
  };

  const cycleOptions: readonly SelectOption<CycleChoice>[] =
    baseCycle !== undefined && cyclePresetFor(baseCycle) === null
      ? [
          ...presetOptions,
          { value: customCycle, label: formatCycle(baseCycle) },
        ]
      : presetOptions;

  return {
    draft,
    set,
    input: draftInput(draft, currency, start, baseCycle ?? null),
    amountError,
    blurAmount,
    expanded,
    toggleExpanded: () => setExpanded((current) => !current),
    cycleOptions,
    start,
    currency,
  };
}

export type SubscriptionFormProps = {
  form: SubscriptionForm;
  dateLabel: string;
  trialHint: string;
  autoFocusName?: boolean;
};

export function SubscriptionForm({
  form,
  dateLabel,
  trialHint,
  autoFocusName = false,
}: SubscriptionFormProps) {
  const amountInput = useRef<InputRef>(null);
  const { draft, set, currency, start } = form;

  return (
    <View>
      <Input
        label={copy.name}
        value={draft.name}
        onChangeText={(value) => set("name", value)}
        placeholder={copy.namePlaceholder}
        maxLength={nameMaxLength}
        autoFocus={autoFocusName}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => amountInput.current?.focus()}
      />
      <Gap size="s16" />
      <Input
        ref={amountInput}
        label={copy.amount}
        mono
        prefix={currency === null ? undefined : currencySymbol(currency)}
        value={draft.amount}
        onChangeText={(value) => set("amount", value)}
        onBlur={form.blurAmount}
        placeholder={copy.amountPlaceholder}
        keyboardType="decimal-pad"
        error={form.amountError}
      />
      <Gap size="s16" />
      <SelectField
        label={copy.every}
        options={form.cycleOptions}
        value={draft.cycle}
        onChange={(value) => set("cycle", value)}
      />
      <DateField
        label={dateLabel}
        value={draft.date}
        minimumDate={toLocalDate(start)}
        maximumDate={toLocalDate(renewalHorizon(start))}
        onChange={(value) => set("date", value)}
      />
      <SelectField
        label={copy.category}
        options={categoryOptions}
        value={draft.category}
        onChange={(value) => set("category", value)}
        placeholder={draft.category === noCategory}
      />
      <Gap size="s16" />
      <Disclosure
        title={copy.more}
        expanded={form.expanded}
        onToggle={form.toggleExpanded}
      />
      {form.expanded ? (
        <View>
          <Gap size="s8" />
          <ToggleRow
            label={copy.trial}
            value={draft.trial}
            onValueChange={(value) => set("trial", value)}
          />
          {draft.trial ? (
            <>
              <Spacer height={layout.input.hintGap} />
              <T style="caption" color="ink3">
                {trialHint}
              </T>
            </>
          ) : null}
          <Gap size="s16" />
          <Input
            label={copy.paymentMethod}
            value={draft.paymentMethod}
            onChangeText={(value) => set("paymentMethod", value)}
            placeholder={copy.paymentMethodPlaceholder}
            maxLength={paymentMethodMaxLength}
            autoCorrect={false}
            hint={copy.paymentMethodHint}
            error={
              looksLikeCardNumber(draft.paymentMethod)
                ? subscriptionsCopy.errors.paymentMethodDigits
                : undefined
            }
          />
          <Gap size="s16" />
          <Input
            label={copy.notes}
            value={draft.notes}
            onChangeText={(value) => set("notes", value)}
            placeholder={copy.notesPlaceholder}
            maxLength={notesMaxLength}
            multiline
          />
        </View>
      ) : null}
    </View>
  );
}
