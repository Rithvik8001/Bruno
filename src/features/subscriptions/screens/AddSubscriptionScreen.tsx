import { router, useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";

import { Gap, Pill, Screen, Spacer, T, Tappable, layout } from "@/design";
import { useProfile } from "@/features/profile";
import { today } from "@/lib/calendar";

import { subscriptionsCopy } from "../copy";
import { emptyDraft } from "../form";
import { useSubscriptions } from "../SubscriptionsProvider";
import { useSubscriptionAlert } from "../useSubscriptionAlert";
import { SubscriptionForm, useSubscriptionForm } from "./SubscriptionForm";

const copy = subscriptionsCopy.form;

export function AddSubscriptionScreen() {
  const { profile } = useProfile();
  const { add } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [start] = useState(() => today());
  const [submitting, setSubmitting] = useState(false);

  const form = useSubscriptionForm({
    initial: emptyDraft(start),
    start,
    currency: profile?.currency ?? null,
  });

  const canSubmit = !submitting && form.input !== null;

  const submit = async () => {
    if (form.input === null || submitting) {
      return;
    }

    setSubmitting(true);
    const result = await add(form.input);
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
      <SubscriptionForm
        form={form}
        dateLabel={copy.firstPayment}
        trialHint={copy.trialHint}
        autoFocusName
      />
      <Spacer grow />
      <Gap size="s24" />
      <Pill title={copy.save} onPress={submit} disabled={!canSubmit} />
      {alert}
    </Screen>
  );
}
