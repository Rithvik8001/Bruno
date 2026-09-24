import { router } from "expo-router";
import { useState, type ReactNode } from "react";

import { View } from "react-native";

import {
  AnimatedMoney,
  Chip,
  Divider,
  EmptyState,
  Gap,
  IconAction,
  IconRow,
  Loading,
  Logo,
  NavBar,
  Screen,
  SectionHeading,
  T,
  TextAction,
  layout,
  useThemeName,
  type ChipTone,
  type IconToken,
} from "@/design";
import { daysBetween, fromLocalDate, nextRenewal } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import {
  formatCycleAdverb,
  formatMonthYear,
  formatPer,
  formatRelativeDay,
  formatWeekdayDate,
  subscriptionLogo,
} from "../format";
import { derivedStatus, isBilling } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import type { Subscription, SubscriptionStatus } from "../types";
import {
  useSubscriptionAlert,
  type SubscriptionAlertConfig,
} from "../useSubscriptionAlert";
import { useToday } from "../useToday";

const copy = subscriptionsCopy.detail;
const relativeTitle = subscriptionsCopy.relativeTitle;
const loadingRows = 4;
const soonDays = 1;

type StatusAction = {
  title: string;
  icon: IconToken;
  target: SubscriptionStatus;
  prompt: Pick<SubscriptionAlertConfig, "title" | "message"> & {
    confirm: string;
  };
};

const pauseAction: StatusAction = {
  icon: "pause",
  title: copy.pause,
  target: "paused",
  prompt: {
    title: copy.pauseTitle,
    message: copy.pauseMessage,
    confirm: copy.pauseConfirm,
  },
};

const resumeAction: StatusAction = {
  icon: "resume",
  title: copy.resume,
  target: "active",
  prompt: {
    title: copy.resumeTitle,
    message: copy.resumeMessage,
    confirm: copy.resumeConfirm,
  },
};

const cancelAction: StatusAction = {
  icon: "cancel",
  title: copy.cancel,
  target: "cancelled",
  prompt: {
    title: copy.cancelTitle,
    message: copy.cancelMessage,
    confirm: copy.cancelConfirm,
  },
};

const reactivateAction: StatusAction = {
  icon: "reactivate",
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

function chips(
  subscription: Subscription,
  trial: boolean,
  daysUntil: number,
): { label: string; tone: ChipTone }[] {
  const items: { label: string; tone: ChipTone }[] = [];
  if (subscription.status === "paused") {
    items.push({ label: copy.paused, tone: "neutral" });
    return items;
  }
  if (subscription.status === "cancelled") {
    items.push({ label: copy.cancelled, tone: "neutral" });
    return items;
  }
  if (trial) {
    items.push({ label: copy.trial, tone: "accent" });
  }
  if (daysUntil <= soonDays) {
    items.push({
      label: daysUntil <= 0 ? relativeTitle.today : relativeTitle.tomorrow,
      tone: "accent",
    });
  }
  return items;
}

function Shell({
  children,
  action,
}: {
  children: ReactNode;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <Screen scroll fill bounce={false}>
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
  const themeName = useThemeName();
  const { remove, setStatus } = useSubscriptions();
  const { alert, show, showFailure } = useSubscriptionAlert();
  const [busy, setBusy] = useState(false);

  const now = useToday();
  const renewal = nextRenewal(subscription.anchorDate, subscription.cycle, now);
  const status = derivedStatus(subscription, now);
  const actions = statusActions(subscription.status);
  const badges = chips(subscription, status === "trial", daysBetween(now, renewal));

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

  const billing = isBilling(status);

  const when = `${formatWeekdayDate(renewal)} · ${formatRelativeDay(renewal, now)}`;
  const summary = !billing
    ? formatCycleAdverb(subscription.cycle)
    : (status === "trial" ? copy.trialEnds : copy.renews).replace(
        "{when}",
        formatRelativeDay(renewal, now),
      );

  return (
    <Shell action={{ title: copy.edit, onPress: openEdit }}>
      <Gap size="s24" />
      <Logo {...subscriptionLogo(subscription, themeName, "detail")} size="detail" />
      <Gap size="s16" />
      <T style="title" accessibilityRole="header">
        {subscription.name}
      </T>
      <Gap size="s4" />
      <T style="caption" color="ink3">
        {summary}
      </T>
      {badges.length === 0 ? null : (
        <>
          <Gap size="s12" />
          <View style={{ flexDirection: "row", gap: layout.chip.gap }}>
            {badges.map((badge) => (
              <Chip key={badge.label} label={badge.label} tone={badge.tone} />
            ))}
          </View>
        </>
      )}
      <Gap size="s20" />
      <AnimatedMoney
        amount={formatMoney(subscription.amountMinor, subscription.currency)}
        caption={formatPer(subscription.cycle)}
        size="display"
      />
      <Divider />
      <SectionHeading top={null} bottom="s4" title={copy.details} />
      {billing ? (
        <IconRow
          icon="calendar"
          title={status === "trial" ? copy.trialUntil : copy.nextPayment}
          subtitle={when}
        />
      ) : null}
      <IconRow
        icon="repeat"
        title={copy.repeats}
        subtitle={formatCycleAdverb(subscription.cycle)}
      />
      {subscription.category === null ? null : (
        <IconRow
          icon="tag"
          title={copy.category}
          subtitle={subscriptionsCopy.categories[subscription.category]}
        />
      )}
      {subscription.paymentMethod === null ? null : (
        <IconRow
          icon="card"
          title={copy.paymentMethod}
          subtitle={subscription.paymentMethod}
        />
      )}
      {subscription.notes === null ? null : (
        <IconRow
          icon="note"
          title={copy.notes}
          subtitle={subscription.notes}
          subtitleLines={0}
        />
      )}
      <IconRow
        icon="clock"
        title={copy.sinceLabel}
        subtitle={formatMonthYear(fromLocalDate(new Date(subscription.createdAt)))}
      />
      <Divider />
      <SectionHeading top={null} bottom="s4" title={copy.actions} />
      {actions.map((action) => (
        <IconRow
          key={action.target + action.title}
          icon={action.icon}
          title={action.title}
          chevron
          onPress={busy ? undefined : () => askStatus(action)}
        />
      ))}
      <IconRow
        icon="trash"
        title={copy.delete}
        chevron
        onPress={busy ? undefined : askDelete}
      />
      <Gap size="s24" />
      {alert}
    </Shell>
  );
}

function LoadingDetail() {
  return (
    <Shell>
      <Gap size="s24" />
      <Loading variant="hero" rows={loadingRows} accessibilityLabel={copy.loading} />
    </Shell>
  );
}

function NotFound() {
  return (
    <Shell>
      <Gap size="s32" />
      <EmptyState
        title={copy.notFoundTitle}
        body={copy.notFoundBody}
        action={{
          title: copy.notFoundAction,
          onPress: () =>
            router.canGoBack() ? router.back() : router.replace("/overview"),
        }}
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
