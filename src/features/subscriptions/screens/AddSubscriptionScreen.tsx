import { router, useNavigation } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import type { TextInput } from "react-native";

import {
  DateField,
  Disclosure,
  Field,
  Gap,
  Pill,
  Screen,
  SelectField,
  Spacer,
  T,
  Tappable,
  ToggleRow,
  layout,
  type SelectOption,
} from "@/design";
import { useProfile } from "@/features/profile";
import { fromLocalDate, toLocalDate, today } from "@/lib/calendar";
import { currencySymbol, parseAmount } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { useSubscriptions } from "../SubscriptionsProvider";
import {
  categories,
  cyclePresets,
  defaultCyclePreset,
  isCategory,
  presetCycle,
  type CyclePreset,
} from "../types";
import { useSubscriptionAlert } from "../useSubscriptionAlert";
import {
  isValidName,
  isValidNotes,
  isValidPaymentMethod,
  isValidRenewalDate,
  looksLikeCardNumber,
  nameMaxLength,
  notesMaxLength,
  paymentMethodMaxLength,
  renewalHorizon,
} from "../validation";

const noCategory = "none";

type CategoryChoice = (typeof categories)[number] | typeof noCategory;

const copy = subscriptionsCopy.form;

const cycleOptions: readonly SelectOption<CyclePreset>[] = cyclePresets.map(
  (preset) => ({ value: preset, label: subscriptionsCopy.cycles[preset] }),
);

const categoryOptions: readonly SelectOption<CategoryChoice>[] = [
  { value: noCategory, label: copy.categoryNone },
  ...categories.map((category) => ({
    value: category,
    label: subscriptionsCopy.categories[category],
  })),
];

export function AddSubscriptionScreen() {
  const amountInput = useRef<TextInput>(null);
  const { profile } = useProfile();
  const { add } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();

  const [start] = useState(() => today());
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>();
  const [cycle, setCycle] = useState<CyclePreset>(defaultCyclePreset);
  const [date, setDate] = useState(() => toLocalDate(start));
  const [category, setCategory] = useState<CategoryChoice>(noCategory);
  const [expanded, setExpanded] = useState(false);
  const [trial, setTrial] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currency = profile?.currency ?? null;
  const amountMinor = currency === null ? null : parseAmount(amount, currency);
  const anchorDate = fromLocalDate(date);

  const canSubmit =
    !submitting &&
    currency !== null &&
    amountMinor !== null &&
    isValidName(name) &&
    isValidRenewalDate(anchorDate, start) &&
    isValidPaymentMethod(paymentMethod) &&
    isValidNotes(notes);

  const submit = async () => {
    if (!canSubmit || amountMinor === null) {
      return;
    }

    setSubmitting(true);
    const result = await add({
      name,
      amountMinor,
      cycle: presetCycle(cycle),
      anchorDate,
      trial,
      category: isCategory(category) ? category : null,
      paymentMethod,
      notes,
    });
    setSubmitting(false);

    if (result.ok) {
      router.back();
      return;
    }
    showFailure(result.reason);
  };

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Tappable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.cancel}
          style={{ paddingHorizontal: layout.navRow.actionPadding }}
        >
          <T style="row" color="ink2">
            {copy.cancel}
          </T>
        </Tappable>
      ),
      headerRight: () => (
        <Tappable
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={copy.confirm}
          style={{ paddingHorizontal: layout.navRow.actionPadding }}
        >
          <T style="button" color={canSubmit ? "ink" : "ink3"}>
            {copy.confirm}
          </T>
        </Tappable>
      ),
    });
  }, [navigation, canSubmit, submit]);

  return (
    <Screen
      scroll
      fill
      keyboard
      header
      scrollViewProps={{ alwaysBounceVertical: false }}
    >
      <T style="title">{copy.title}</T>
      <Gap size="s24" />

      <Field
        label={copy.name}
        size="field"
        value={name}
        onChangeText={setName}
        placeholder={copy.namePlaceholder}
        maxLength={nameMaxLength}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => amountInput.current?.focus()}
      />
      <Field
        ref={amountInput}
        label={copy.amount}
        size="amount"
        prefix={currency === null ? undefined : currencySymbol(currency)}
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setAmountError(undefined);
        }}
        onBlur={() => {
          if (amount.trim().length > 0 && amountMinor === null) {
            setAmountError(subscriptionsCopy.errors.amountInvalid);
          }
        }}
        placeholder={copy.amountPlaceholder}
        keyboardType="decimal-pad"
        error={amountError}
      />
      <SelectField
        label={copy.every}
        options={cycleOptions}
        value={cycle}
        onChange={setCycle}
      />
      <DateField
        label={copy.firstPayment}
        value={date}
        minimumDate={toLocalDate(start)}
        maximumDate={toLocalDate(renewalHorizon(start))}
        onChange={setDate}
      />
      <SelectField
        label={copy.category}
        options={categoryOptions}
        value={category}
        onChange={setCategory}
        placeholder={category === noCategory}
      />

      <Gap size="s20" />
      <Disclosure
        title={copy.more}
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      />

      {expanded ? (
        <>
          <ToggleRow
            label={copy.trial}
            value={trial}
            onValueChange={setTrial}
            last={false}
          />
          {trial ? (
            <>
              <Spacer height={layout.field.noteGap} />
              <T style="caption" color="ink3">
                {copy.trialHint}
              </T>
            </>
          ) : null}
          <Field
            label={copy.paymentMethod}
            size="field"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder={copy.paymentMethodPlaceholder}
            maxLength={paymentMethodMaxLength}
            autoCorrect={false}
            hint={copy.paymentMethodHint}
            error={
              looksLikeCardNumber(paymentMethod)
                ? subscriptionsCopy.errors.paymentMethodDigits
                : undefined
            }
          />
          <Field
            label={copy.notes}
            size="field"
            value={notes}
            onChangeText={setNotes}
            placeholder={copy.notesPlaceholder}
            maxLength={notesMaxLength}
          />
        </>
      ) : null}

      <Spacer grow />
      <Gap size="s24" />
      <Pill title={copy.save} onPress={submit} disabled={!canSubmit} />
      {alert}
    </Screen>
  );
}
