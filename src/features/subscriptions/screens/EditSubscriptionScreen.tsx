import { router, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";

import {
  Gap,
  Pill,
  Screen,
  Spacer,
  T,
  Tappable,
  layout,
} from "@/design";
import { today } from "@/lib/calendar";

import { subscriptionsCopy } from "../copy";
import { draftFrom, hasExtras, isDraftDirty } from "../form";
import { useSubscriptions } from "../SubscriptionsProvider";
import type { Subscription } from "../types";
import { useSubscriptionAlert } from "../useSubscriptionAlert";
import { SubscriptionForm, useSubscriptionForm } from "./SubscriptionForm";

const copy = subscriptionsCopy.edit;
const formCopy = subscriptionsCopy.form;

type HeaderProps = {
  canSave: boolean;
  onSave: (() => void) | null;
};

function useModalHeader({ canSave, onSave }: HeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Tappable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={formCopy.cancel}
          style={{ paddingHorizontal: layout.navRow.actionPadding }}
        >
          <T style="row" color="ink2">
            {formCopy.cancel}
          </T>
        </Tappable>
      ),
      headerRight:
        onSave === null
          ? () => null
          : () => (
              <Tappable
                onPress={onSave}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityLabel={copy.confirm}
                style={{ paddingHorizontal: layout.navRow.actionPadding }}
              >
                <T style="button" color={canSave ? "ink" : "ink3"}>
                  {copy.confirm}
                </T>
              </Tappable>
            ),
    });
  }, [navigation, canSave, onSave]);
}

function EditForm({ subscription }: { subscription: Subscription }) {
  const { update } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [start] = useState(() => today());
  const [initial] = useState(() => draftFrom(subscription, start));
  const [submitting, setSubmitting] = useState(false);

  const form = useSubscriptionForm({
    initial,
    start,
    currency: subscription.currency,
    baseCycle: subscription.cycle,
    initiallyExpanded: hasExtras(initial),
  });

  const canSave =
    !submitting &&
    form.input !== null &&
    isDraftDirty(form.input, subscription, start);

  const save = async () => {
    if (form.input === null || !canSave) {
      return;
    }

    setSubmitting(true);
    const result = await update(subscription.id, form.input);
    setSubmitting(false);

    if (result.ok) {
      router.back();
      return;
    }
    showFailure(result.reason);
  };

  useModalHeader({ canSave, onSave: save });

  return (
    <>
      <T style="title">{copy.title}</T>
      <Gap size="s24" />
      <SubscriptionForm
        form={form}
        dateLabel={copy.nextPayment}
        trialHint={copy.trialHint}
      />
      <Spacer grow />
      <Gap size="s24" />
      <Pill title={copy.save} onPress={save} disabled={!canSave} />
      {alert}
    </>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  useModalHeader({ canSave: false, onSave: null });

  if (loading) {
    return (
      <>
        <T style="title">{copy.title}</T>
        <Gap size="s24" />
        <T style="body" color="ink3">
          {subscriptionsCopy.list.loading}
        </T>
      </>
    );
  }

  return (
    <>
      <T style="title">{copy.notFoundTitle}</T>
      <Gap size="s24" />
      <T style="body" color="ink2">
        {copy.notFoundBody}
      </T>
      <Spacer grow />
      <Gap size="s24" />
      <Pill title={formCopy.cancel} onPress={() => router.back()} />
    </>
  );
}

export function EditSubscriptionScreen({ id }: { id: string | null }) {
  const { status, subscriptions } = useSubscriptions();
  const found =
    id === null
      ? undefined
      : subscriptions.find((subscription) => subscription.id === id);
  const [snapshot, setSnapshot] = useState<Subscription | null>(
    found ?? null,
  );

  useEffect(() => {
    if (snapshot === null && found !== undefined) {
      setSnapshot(found);
    }
  }, [snapshot, found]);

  return (
    <Screen
      scroll
      fill
      keyboard
      header
      scrollViewProps={{ alwaysBounceVertical: false }}
    >
      {snapshot === null ? (
        <EmptyState loading={id !== null && status === "loading"} />
      ) : (
        <EditForm subscription={snapshot} />
      )}
    </Screen>
  );
}
