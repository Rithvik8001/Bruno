import { router } from "expo-router";
import { useState } from "react";

import {
  Gap,
  Label,
  NavRow,
  Screen,
  SettingsRow,
  Spacer,
  T,
  TextLink,
} from "@/design";
import { nextRenewal, today } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { formatCycle, formatLongDate } from "../format";
import { derivedStatus } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import type { Subscription } from "../types";
import { useSubscriptionAlert } from "../useSubscriptionAlert";

const copy = subscriptionsCopy.detail;

function statusLine(
  subscription: Subscription,
  renewal: string,
): string | null {
  switch (derivedStatus(subscription, today())) {
    case "trial":
      return `${copy.trialUntil} ${renewal}`;
    case "paused":
      return copy.paused;
    case "cancelled":
      return copy.cancelled;
    case "active":
      return null;
  }
}

function Detail({ subscription }: { subscription: Subscription }) {
  const { remove } = useSubscriptions();
  const { alert, show, showFailure } = useSubscriptionAlert();
  const [deleting, setDeleting] = useState(false);

  const renewal = formatLongDate(
    nextRenewal(subscription.anchorDate, subscription.cycle, today()),
  );
  const cycle = formatCycle(subscription.cycle);

  const status = statusLine(subscription, renewal);

  const facts = [
    { label: copy.nextPayment, value: renewal },
    ...(subscription.category === null
      ? []
      : [
          {
            label: copy.category,
            value: subscriptionsCopy.categories[subscription.category],
          },
        ]),
    ...(subscription.paymentMethod === null
      ? []
      : [{ label: copy.paymentMethod, value: subscription.paymentMethod }]),
  ];

  const openEdit = () =>
    router.push({
      pathname: "/edit-subscription",
      params: { id: subscription.id },
    });

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await remove(subscription.id);
    setDeleting(false);

    if (result.ok) {
      router.back();
      return;
    }
    showFailure(result.reason);
  };

  const askDelete = () => {
    show({
      title: copy.deleteTitle,
      message: copy.deleteMessage,
      actions: [
        { title: copy.deleteCancel, role: "cancel" },
        {
          title: copy.deleteConfirm,
          role: "destructive",
          onPress: confirmDelete,
        },
      ],
    });
  };

  return (
    <>
      <NavRow
        onBack={() => router.back()}
        backAccessibilityLabel={copy.back}
        action={{ title: copy.edit, onPress: openEdit }}
      />
      <Gap size="s32" />
      <T style="title">{subscription.name}</T>
      {status === null ? null : (
        <>
          <Gap size="s8" />
          <T style="body" color="accent">
            {status}
          </T>
        </>
      )}

      <Gap size="s36" />
      <T
        style="moneyM"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {formatMoney(subscription.amountMinor, subscription.currency)}
      </T>
      <Gap size="s8" />
      <T style="body" color="ink3">
        {`${copy.every} ${cycle.toLowerCase()}`}
      </T>

      <Gap size="s36" />
      {facts.map((fact, index) => (
        <SettingsRow
          key={fact.label}
          label={fact.label}
          value={fact.value}
          chevron={false}
          last={index === facts.length - 1}
        />
      ))}

      {subscription.notes === null ? null : (
        <>
          <Gap size="s24" />
          <Label>{copy.notes}</Label>
          <Gap size="s8" />
          <T style="body" color="ink2">
            {subscription.notes}
          </T>
        </>
      )}

      <Spacer grow />
      <Gap size="s36" />
      <TextLink title={copy.delete} onPress={askDelete} disabled={deleting} />
      {alert}
    </>
  );
}

function NotFound() {
  return (
    <>
      <NavRow
        onBack={() => router.back()}
        backAccessibilityLabel={copy.back}
      />
      <Gap size="s32" />
      <T style="title">{copy.notFoundTitle}</T>
      <Gap size="s8" />
      <T style="body" color="ink2">
        {copy.notFoundBody}
      </T>
    </>
  );
}

export function SubscriptionDetailScreen({ id }: { id: string | null }) {
  const { subscriptions } = useSubscriptions();
  const subscription =
    id === null ? undefined : subscriptions.find((item) => item.id === id);

  return (
    <Screen scroll fill scrollViewProps={{ alwaysBounceVertical: false }}>
      {subscription === undefined ? (
        <NotFound />
      ) : (
        <Detail subscription={subscription} />
      )}
    </Screen>
  );
}
