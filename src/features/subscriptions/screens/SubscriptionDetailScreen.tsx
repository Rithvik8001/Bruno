import { router } from "expo-router";
import { useState, type ReactNode } from "react";

import {
  EmptyState,
  Gap,
  IconAction,
  ListRow,
  Loading,
  Money,
  NavBar,
  Screen,
  SectionLabel,
  Spacer,
  T,
  TextAction,
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
const loadingRows = 4;

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

function captionLine(subscription: Subscription, trial: boolean): string {
  const parts: string[] = [];
  if (subscription.status === "paused") {
    parts.push(copy.paused);
  } else if (subscription.status === "cancelled") {
    parts.push(copy.cancelled);
  } else if (trial) {
    parts.push(copy.trial);
  }
  if (subscription.category !== null) {
    parts.push(subscriptionsCopy.categories[subscription.category]);
  }
  parts.push(formatCycleAdverb(subscription.cycle));
  return parts.join(separator);
}

function Shell({
  children,
  action,
}: {
  children: ReactNode;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <Screen scroll fill scrollViewProps={{ alwaysBounceVertical: false }}>
      <NavBar
        left={
          <IconAction
            icon="back"
            onPress={() => router.back()}
            accessibilityLabel={copy.back}
          />
        }
        right={
          action === undefined ? null : (
            <TextAction title={action.title} onPress={action.onPress} />
          )
        }
      />
      {children}
    </Screen>
  );
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

  const nextLine = !isBilling(status)
    ? undefined
    : status === "trial"
      ? copy.trialUntil.replace("{date}", formatWeekdayDate(renewal))
      : `${copy.nextPayment.replace("{date}", formatWeekdayDate(renewal))}${separator}${formatRelativeDay(renewal, now)}`;

  return (
    <Shell action={{ title: copy.edit, onPress: openEdit }}>
      <Gap size="s24" />
      <T style="title" accessibilityRole="header">
        {subscription.name}
      </T>
      <Gap size="s4" />
      <T style="caption" color="ink3">
        {captionLine(subscription, status === "trial")}
      </T>
      <Gap size="s24" />
      <Money
        amount={formatMoney(subscription.amountMinor, subscription.currency)}
        caption={formatPer(subscription.cycle)}
      />
      {nextLine === undefined ? null : (
        <>
          <Gap size="s8" />
          <T style="caption" color="ink2">
            {nextLine}
          </T>
        </>
      )}
      <SectionLabel title={copy.details} />
      <>
        {subscription.category === null ? null : (
          <ListRow
            title={copy.category}
            value={subscriptionsCopy.categories[subscription.category]}
            mono={false}
          />
        )}
        <ListRow
          title={copy.billing}
          value={formatCycleAdverb(subscription.cycle)}
          mono={false}
        />
        {subscription.paymentMethod === null ? null : (
          <ListRow
            title={copy.paymentMethod}
            value={subscription.paymentMethod}
            mono={false}
          />
        )}
        <ListRow
          title={copy.sinceLabel}
          value={formatMonthYear(
            fromLocalDate(new Date(subscription.createdAt)),
          )}
          mono={false}
        />
      </>
      {subscription.notes === null ? null : (
        <>
          <SectionLabel title={copy.notes} />
          <T style="body" color="ink2">
            {subscription.notes}
          </T>
        </>
      )}
      <Spacer grow />
      <Gap size="s32" />
      <>
        {actions.map((action, index) => (
          <ListRow
            key={action.target}
            title={action.title}
            tone={index === 0 ? "ink" : "ink2"}
            onPress={busy ? undefined : () => askStatus(action)}
          />
        ))}
        <ListRow
          title={copy.delete}
          tone="ink2"
          onPress={busy ? undefined : askDelete}
        />
      </>
      {alert}
    </Shell>
  );
}

function LoadingDetail() {
  return (
    <Shell>
      <Gap size="s24" />
      <Loading rows={loadingRows} accessibilityLabel={copy.loading} />
    </Shell>
  );
}

function NotFound() {
  return (
    <Shell>
      <Gap size="s24" />
      <EmptyState
        title={copy.notFoundTitle}
        body={copy.notFoundBody}
        action={{ title: copy.notFoundAction, onPress: () => router.back() }}
      />
    </Shell>
  );
}

export function SubscriptionDetailScreen({ id }: { id: string | null }) {
  const { status, subscriptions } = useSubscriptions();
  const subscription =
    id === null ? undefined : subscriptions.find((item) => item.id === id);

  if (subscription !== undefined) {
    return <Detail subscription={subscription} />;
  }
  if (id !== null && status === "loading") {
    return <LoadingDetail />;
  }
  return <NotFound />;
}
