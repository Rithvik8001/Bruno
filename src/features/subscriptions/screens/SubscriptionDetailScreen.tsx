import { router } from "expo-router";
import { useState } from "react";

import {
  EmptyState,
  Gap,
  MoneyHero,
  NavRow,
  Screen,
  SectionHeader,
  SettingsRow,
  Spacer,
  T,
} from "@/design";
import { fromLocalDate, nextRenewal, today } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import {
  formatCycleAdverb,
  formatMonthYear,
  formatPer,
  formatRelativeDay,
  formatWeekdayDate,
} from "../format";
import { derivedStatus, isBilling } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import type { Subscription, SubscriptionStatus } from "../types";
import {
  useSubscriptionAlert,
  type SubscriptionAlertConfig,
} from "../useSubscriptionAlert";

const copy = subscriptionsCopy.detail;
const separator = " · ";

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

function captionLine(subscription: Subscription): string {
  const parts: string[] = [];
  if (subscription.status === "paused") {
    parts.push(copy.paused);
  } else if (subscription.status === "cancelled") {
    parts.push(copy.cancelled);
  }
  if (subscription.category !== null) {
    parts.push(subscriptionsCopy.categories[subscription.category]);
  }
  parts.push(formatCycleAdverb(subscription.cycle));
  if (subscription.paymentMethod !== null) {
    parts.push(subscription.paymentMethod);
  }
  parts.push(
    copy.since.replace(
      "{month}",
      formatMonthYear(fromLocalDate(new Date(subscription.createdAt))),
    ),
  );
  return parts.join(separator);
}

function Detail({ subscription }: { subscription: Subscription }) {
  const { remove, setStatus } = useSubscriptions();
  const { alert, show, showFailure } = useSubscriptionAlert();
  const [busy, setBusy] = useState(false);

  const now = today();
  const renewal = nextRenewal(subscription.anchorDate, subscription.cycle, now);
  const status = derivedStatus(subscription, now);
  const actions = statusActions(subscription.status);

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
        plain
        onBack={() => router.back()}
        backAccessibilityLabel={copy.back}
        action={{ title: copy.edit, onPress: openEdit }}
      />
      <Gap size="s48" />
      <T style="title">{subscription.name}</T>
      <Gap size="s12" />
      <T style="caption" color="ink3">
        {captionLine(subscription)}
      </T>

      <Gap size="s32" />
      <MoneyHero
        size="s"
        inline
        amount={formatMoney(subscription.amountMinor, subscription.currency)}
        caption={formatPer(subscription.cycle)}
      />
      {isBilling(status) ? (
        <>
          <Gap size="s16" />
          <T style="body" color="ink2">
            {status === "trial"
              ? copy.trialUntil.replace("{date}", formatWeekdayDate(renewal))
              : copy.nextPayment.replace(
                  "{date}",
                  formatWeekdayDate(renewal),
                )}
            {status === "trial" ? null : (
              <T style="body" color="accent">
                {formatRelativeDay(renewal, now)}
              </T>
            )}
          </T>
        </>
      ) : null}

      {subscription.notes === null ? null : (
        <>
          <SectionHeader label={copy.notes} bottom="s8" />
          <T style="body" color="ink2">
            {subscription.notes}
          </T>
        </>
      )}

      <Spacer grow />
      <Gap size="s24" />
      {actions.map((action, index) => (
        <SettingsRow
          key={action.target}
          label={action.title}
          chevron={false}
          tone={index === 0 ? "ink" : "ink2"}
          onPress={busy ? undefined : () => askStatus(action)}
        />
      ))}
      <SettingsRow
        label={copy.delete}
        chevron={false}
        tone="ink2"
        last
        onPress={busy ? undefined : askDelete}
      />
      {alert}
    </>
  );
}

function NotFound() {
  return (
    <>
      <NavRow
        plain
        onBack={() => router.back()}
        backAccessibilityLabel={copy.back}
      />
      <Gap size="s48" />
      <T style="title">{copy.notFoundTitle}</T>
      <Gap size="s12" />
      <EmptyState body={copy.notFoundBody} />
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
