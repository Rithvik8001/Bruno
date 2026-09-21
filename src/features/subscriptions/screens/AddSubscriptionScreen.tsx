import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";

import {
  DateRow,
  Field,
  Gap,
  NavRow,
  Pill,
  PickerRow,
  Screen,
  Spacer,
  T,
  ToggleRow,
  layout,
  type PickerOption,
} from "@/design";
import { useProfile } from "@/features/profile";
import { fromLocalDate, toLocalDate, today } from "@/lib/calendar";
import { parseAmount } from "@/lib/money";

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

const cycleOptions: readonly PickerOption<CyclePreset>[] = cyclePresets.map(
  (preset) => ({ value: preset, label: subscriptionsCopy.cycles[preset] }),
);

const categoryOptions: readonly PickerOption<CategoryChoice>[] = [
  { value: noCategory, label: subscriptionsCopy.form.categoryNone },
  ...categories.map((category) => ({
    value: category,
    label: subscriptionsCopy.categories[category],
  })),
];

export function AddSubscriptionScreen() {
  const copy = subscriptionsCopy.form;
  const amountInput = useRef<TextInput>(null);
  const { profile } = useProfile();
  const { add } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();

  const [start] = useState(() => today());
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>();
  const [cycle, setCycle] = useState<CyclePreset>(defaultCyclePreset);
  const [trial, setTrial] = useState(false);
  const [date, setDate] = useState(() => toLocalDate(start));
  const [category, setCategory] = useState<CategoryChoice>(noCategory);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currency = profile?.currency ?? null;
  const amountMinor = currency === null ? null : parseAmount(amount, currency);
  const anchorDate = fromLocalDate(date);
  const paymentMethodError = looksLikeCardNumber(paymentMethod)
    ? subscriptionsCopy.errors.paymentMethodDigits
    : undefined;

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

  const amountHint =
    currency === null
      ? undefined
      : `${trial ? copy.trialAmountHintLead : copy.amountHintLead}${currency}${copy.amountHintTail}`;

  return (
    <Screen
      scroll
      fill
      keyboard
      scrollViewProps={{ alwaysBounceVertical: false }}
    >
      <NavRow
        onBack={() => router.back()}
        backIcon="close"
        backAccessibilityLabel={copy.close}
      />
      <Gap size="s32" />
      <T style="title">{copy.title}</T>
      <Gap size="s40" />
      <Field
        label={copy.name}
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
      <Spacer height={layout.form.fieldGap} />
      <Field
        ref={amountInput}
        label={copy.amount}
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
        hint={amountHint}
        error={amountError}
      />
      <Gap size="s24" />
      <PickerRow
        label={copy.cycle}
        options={cycleOptions}
        value={cycle}
        onChange={setCycle}
      />
      <ToggleRow
        label={copy.trial}
        value={trial}
        onValueChange={setTrial}
        last={false}
      />
      <DateRow
        label={trial ? copy.trialEnds : copy.nextRenewal}
        value={date}
        minimumDate={toLocalDate(start)}
        maximumDate={toLocalDate(renewalHorizon(start))}
        onChange={setDate}
      />
      <PickerRow
        label={copy.category}
        options={categoryOptions}
        value={category}
        onChange={setCategory}
        last
      />
      <Spacer height={layout.form.fieldGap} />
      <Field
        label={copy.paymentMethod}
        value={paymentMethod}
        onChangeText={setPaymentMethod}
        placeholder={copy.paymentMethodPlaceholder}
        maxLength={paymentMethodMaxLength}
        autoCorrect={false}
        hint={copy.paymentMethodHint}
        error={paymentMethodError}
      />
      <Spacer height={layout.form.fieldGap} />
      <Field
        label={copy.notes}
        value={notes}
        onChangeText={setNotes}
        maxLength={notesMaxLength}
        size="field"
      />
      <Spacer grow />
      <Gap size="s24" />
      <Pill title={copy.save} onPress={submit} disabled={!canSubmit} />
      {alert}
    </Screen>
  );
}
