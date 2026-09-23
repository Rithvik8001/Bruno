import { router, useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";

import { Button, Gap, Screen, Spacer, T, TextAction } from "@/design";
import { usePushStatus } from "@/features/notifications";
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
  const { add, subscriptions } = useSubscriptions();
  const { permission, requestPermission } = usePushStatus();
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
    const first = subscriptions.length === 0;
    const result = await add(form.input);
    setSubmitting(false);

    if (result.ok) {
      router.back();
      if (first && permission?.status === "undetermined") {
        void requestPermission();
      }
      return;
    }
    showFailure(result.reason);
  };

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TextAction title={copy.cancel} onPress={() => router.back()} />
      ),
      headerRight: () => (
        <TextAction
          title={copy.confirm}
          onPress={submit}
          disabled={!canSubmit}
          prominent
        />
      ),
    });
  }, [navigation, canSubmit, submit]);

  return (
    <Screen scroll fill keyboard header bounce={false}>
      <T style="title" accessibilityRole="header">
        {copy.title}
      </T>
      <Gap size="s24" />
      <SubscriptionForm
        form={form}
        dateLabel={copy.firstPayment}
        trialHint={copy.trialHint}
        autoFocusName
      />
      <Spacer grow />
      <Gap size="s32" />
      <Button
        title={copy.save}
        onPress={submit}
        disabled={!canSubmit}
        loading={submitting}
      />
      {alert}
    </Screen>
  );
}
