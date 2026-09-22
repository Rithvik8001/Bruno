import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Gap,
  GlassButton,
  Label,
  NavRow,
  Screen,
  SettingsRow,
  Spacer,
  heroMinimumFontScale,
  T,
} from "@/design";
import { nextRenewal, today } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { formatCycle, formatLongDate } from "../format";
import { derivedStatus } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import type { Subscription, SubscriptionStatus } from "../types";
import {
  useSubscriptionAlert,
  type SubscriptionAlertConfig,
} from "../useSubscriptionAlert";

const copy = subscriptionsCopy.detail;

type StatusAction = {
  title: string;
  target: SubscriptionStatus;
  prompt: Pick<SubscriptionAlertConfig, "title" | "message"> & {
    confirm: string;
  };
};

const pauseAction: StatusAction = {
  title: copy.pause,
  target: "paused",
  prompt: {
    title: copy.pauseTitle,
    message: copy.pauseMessage,
    confirm: copy.pauseConfirm,
  },
};

const resumeAction: StatusAction = {
  title: copy.resume,
  target: "active",
  prompt: {
    title: copy.resumeTitle,
    message: copy.resumeMessage,
    confirm: copy.resumeConfirm,
  },
};

const cancelAction: StatusAction = {
  title: copy.cancel,
  target: "cancelled",
  prompt: {
    title: copy.cancelTitle,
    message: copy.cancelMessage,
    confirm: copy.cancelConfirm,
  },
};

const reactivateAction: StatusAction = {
  title: copy.reactivate,
  target: "active",
  prompt: {
    title: copy.reactivateTitle,
    message: copy.reactivateMessage,
    confirm: copy.reactivateConfirm,
  },
};

function statusActions(status: SubscriptionStatus): readonly StatusAction[] {
  switch (status) {
    case "active":
      return [pauseAction, cancelAction];
    case "paused":
      return [resumeAction, cancelAction];
    case "cancelled":
      return [reactivateAction];
  }
}

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
  const { remove, setStatus } = useSubscriptions();
  const { alert, show, showFailure } = useSubscriptionAlert();
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    const result = await remove(subscription.id);
    setBusy(false);

    if (result.ok) {
      router.back();
      return;
    }
    showFailure(result.reason);
  };

  const confirmStatus = async (target: SubscriptionStatus) => {
    setBusy(true);
    const result = await setStatus(subscription.id, target);
    setBusy(false);

    if (!result.ok) {
      showFailure(result.reason);
    }
  };

  const askStatus = (action: StatusAction) => {
    show({
      title: action.prompt.title,
      message: action.prompt.message,
      actions: [
        { title: copy.keep, role: "cancel" },
        {
          title: action.prompt.confirm,
          onPress: () => {
            void confirmStatus(action.target);
          },
        },
      ],
    });
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
        minimumFontScale={heroMinimumFontScale}
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
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        {statusActions(subscription.status).map((action, index) => (
          <View key={action.target} style={{ flexDirection: "row" }}>
            {index === 0 ? null : <Gap size="s12" horizontal />}
            <GlassButton
              title={action.title}
              onPress={() => askStatus(action)}
              disabled={busy}
            />
          </View>
        ))}
      </View>
      <Gap size="s16" />
      <View style={{ alignItems: "center" }}>
        <GlassButton
          title={copy.delete}
          onPress={askDelete}
          disabled={busy}
        />
      </View>
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
