import { router, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  Button,
  EmptyState,
  Gap,
  Loading,
  Screen,
  Spacer,
  T,
  TextAction,
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
const loadingRows = 4;

type HeaderProps = {
  canSave: boolean;
  onSave: (() => void) | null;
};

function useModalHeader({ canSave, onSave }: HeaderProps) {
  const navigation = useNavigation();
  const latestSave = useRef(onSave);
  const hasSave = onSave !== null;

  useEffect(() => {
    latestSave.current = onSave;
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TextAction title={formCopy.cancel} onPress={() => router.back()} />
      ),
      headerRight:
        hasSave
          ? () => (
              <TextAction
                title={copy.confirm}
                onPress={() => latestSave.current?.()}
                disabled={!canSave}
                prominent
              />
            )
          : () => null,
    });
  }, [navigation, canSave, hasSave]);
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
      <T style="title" accessibilityRole="header">
        {copy.title}
      </T>
      <Gap size="s24" />
      <SubscriptionForm
        form={form}
        dateLabel={copy.nextPayment}
        trialHint={copy.trialHint}
      />
      <Spacer grow />
      <Gap size="s32" />
      <Button
        title={copy.save}
        onPress={save}
        disabled={!canSave}
        loading={submitting}
      />
      {alert}
    </>
  );
}

function Fallback({ loading }: { loading: boolean }) {
  useModalHeader({ canSave: false, onSave: null });

  if (loading) {
    return (
      <>
        <T style="title" accessibilityRole="header">
          {copy.title}
        </T>
        <Gap size="s24" />
        <Loading rows={loadingRows} accessibilityLabel={subscriptionsCopy.list.loading} />
      </>
    );
  }

  return (
    <>
      <Gap size="s24" />
      <EmptyState
        title={copy.notFoundTitle}
        body={copy.notFoundBody}
        action={{ title: copy.notFoundAction, onPress: () => router.back() }}
      />
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
    <Screen scroll fill keyboard header bounce={false}>
      {snapshot === null ? (
        <Fallback loading={id !== null && status === "loading"} />
      ) : (
        <EditForm subscription={snapshot} />
      )}
    </Screen>
  );
}
