import { useRef, useState } from "react";
import { View } from "react-native";

import {
  DateField,
  Disclosure,
  Gap,
  Group,
  Input,
  Loading,
  Logo,
  LogoRow,
  SectionHeading,
  SelectField,
  Spacer,
  T,
  TextLink,
  ToggleRow,
  layout,
  useThemeName,
  type InputRef,
  type SelectOption,
} from "@/design";
import {
  toLocalDate,
  type BillingCycle,
  type CalendarDate,
} from "@/lib/calendar";
import { logoUrl } from "@/lib/logos";
import { currencySymbol, parseAmount, toAmountInput } from "@/lib/money";

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
import { searchMinLength, type ServiceSuggestion } from "../logos";
import {
  categories,
  cyclePresetFor,
  cyclePresets,
  type NewSubscription,
} from "../types";
import { useServiceSearch } from "../useServiceSearch";
import {
  looksLikeCardNumber,
  nameMaxLength,
  normalizeName,
  notesMaxLength,
  paymentMethodMaxLength,
  renewalHorizon,
} from "../validation";

const copy = subscriptionsCopy.form;
const groupInset = layout.icon.row + layout.row.gap;
const skeletonRows = 3;

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
  nameActive: boolean;
  setNameActive: (active: boolean) => void;
  pickedName: string | null;
  pick: (suggestion: ServiceSuggestion) => void;
  removeLogo: () => void;
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
  const [nameActive, setNameActive] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(
    initial.serviceKey === null ? null : normalizeName(initial.name),
  );

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

  const pick = (suggestion: ServiceSuggestion) => {
    setDraft((current) => ({
      ...current,
      name: suggestion.name,
      serviceKey: suggestion.domain,
    }));
    setPickedName(normalizeName(suggestion.name));
    setNameActive(false);
  };

  const removeLogo = () => {
    setDraft((current) => ({ ...current, serviceKey: null }));
    setPickedName(null);
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
    nameActive,
    setNameActive,
    pickedName,
    pick,
    removeLogo,
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
  const themeName = useThemeName();
  const amountInput = useRef<InputRef>(null);
  const { draft, set, currency, start } = form;
  const nameChanged = normalizeName(draft.name) !== form.pickedName;
  const searching = form.nameActive && nameChanged;
  const search = useServiceSearch(draft.name, searching);
  const eligible = searching && draft.name.trim().length >= searchMinLength;
  const showSuggestions = eligible && search.results.length > 0;
  const showSearching = eligible && search.results.length === 0 && search.searching;
  const showNoMatches = eligible && search.results.length === 0 && !search.searching;

  const focusAmount = () => {
    form.setNameActive(false);
    amountInput.current?.focus();
  };

  const pick = (suggestion: ServiceSuggestion) => {
    form.pick(suggestion);
    amountInput.current?.focus();
  };

  return (
    <View>
      <Logo
        name={draft.name}
        uri={logoUrl(draft.serviceKey, {
          theme: themeName,
          px: layout.logo.request.large,
        })}
        size="detail"
      />
      <Gap size="s16" />
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
        onFocus={() => form.setNameActive(true)}
        onSubmitEditing={focusAmount}
        hint={
          form.nameActive && draft.serviceKey === null && !showNoMatches
            ? copy.nameHint
            : showNoMatches
              ? copy.noMatches
              : undefined
        }
      />
      {draft.serviceKey === null ? null : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: layout.row.gap,
          }}
        >
          <T style="caption" color="ink3" numberOfLines={1} override={{ flex: 1 }}>
            {copy.logoFrom.replace("{domain}", draft.serviceKey)}
          </T>
          <TextLink title={copy.removeLogo} onPress={form.removeLogo} />
        </View>
      )}
      {showSearching ? (
        <>
          <SectionHeading size="small" top="s16" bottom="s4" title={copy.searching} />
          <Loading rows={skeletonRows} accessibilityLabel={copy.searching} />
        </>
      ) : null}
      {showSuggestions ? (
        <>
          <SectionHeading size="small" top="s16" bottom="s4" title={copy.suggestions} />
          {search.results.slice(0, layout.suggestions.max).map((suggestion) => (
            <LogoRow
              key={suggestion.domain}
              title={suggestion.name}
              subtitle={suggestion.domain}
              logo={{
                name: suggestion.name,
                uri: logoUrl(suggestion.domain, {
                  theme: themeName,
                  px: layout.logo.request.small,
                }),
              }}
              onPress={() => pick(suggestion)}
            />
          ))}
        </>
      ) : null}
      <Gap size="s16" />
      <Input
        ref={amountInput}
        label={copy.amount}
        mono
        prefix={currency === null ? undefined : currencySymbol(currency)}
        value={draft.amount}
        onChangeText={(value) => set("amount", value)}
        onFocus={() => form.setNameActive(false)}
        onBlur={form.blurAmount}
        placeholder={
          currency === null ? copy.amountPlaceholder : toAmountInput(0, currency)
        }
        keyboardType="decimal-pad"
        error={form.amountError}
      />
      <Gap size="s16" />
      <Group inset={groupInset}>
        <SelectField
          icon="repeat"
          label={copy.every}
          options={form.cycleOptions}
          value={draft.cycle}
          onChange={(value) => set("cycle", value)}
        />
        <DateField
          icon="calendar"
          label={dateLabel}
          value={draft.date}
          minimumDate={toLocalDate(start)}
          maximumDate={toLocalDate(renewalHorizon(start))}
          onChange={(value) => set("date", value)}
        />
        <SelectField
          icon="tag"
          label={copy.category}
          options={categoryOptions}
          value={draft.category}
          onChange={(value) => set("category", value)}
          placeholder={draft.category === noCategory}
        />
      </Group>
      <Gap size="s16" />
      <Disclosure
        title={copy.more}
        expanded={form.expanded}
        onToggle={form.toggleExpanded}
      />
      {form.expanded ? (
        <View>
          <Gap size="s8" />
          <Group inset={groupInset}>
            <ToggleRow
              icon="trial"
              label={copy.trial}
              value={draft.trial}
              onValueChange={(value) => set("trial", value)}
            />
          </Group>
          {draft.trial ? (
            <>
              <Spacer height={layout.field.hintGap} />
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
