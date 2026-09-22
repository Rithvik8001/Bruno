import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl } from "react-native";

import {
  BarList,
  EmptyState,
  Gap,
  NativeList,
  Loading,
  Money,
  Screen,
  SectionLabel,
  T,
  useTheme,
} from "@/design";
import { useProfile } from "@/features/profile";
import {
  categoryBreakdown,
  dueWithin,
  failureMessage,
  formatLedgerDate,
  formatMonthYear,
  formatRelativeDay,
  statusCounts,
  subscriptionsCopy,
  summarize,
  useSubscriptionAlert,
  useSubscriptions,
} from "@/features/subscriptions";
import { today } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.overview;
const windowDays = 7;
const breakdownLimit = 3;
const percent = 100;
const loadingRows = 3;

function closingLine(counts: ReturnType<typeof statusCounts>): string {
  const parts = [
    counts.total === 1
      ? copy.closingOne
      : copy.closingMany.replace("{count}", String(counts.total)),
  ];
  if (counts.paused > 0) {
    parts.push(copy.closingPaused.replace("{count}", String(counts.paused)));
  }
  if (counts.cancelled > 0) {
    parts.push(
      copy.closingCancelled.replace("{count}", String(counts.cancelled)),
    );
  }
  return parts.join(" ");
}

export function OverviewScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [refreshing, setRefreshing] = useState(false);

  const now = today();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, billing, count } = summarize(subscriptions, now, currency);
  const due = dueWithin(billing, now, windowDays);
  const breakdown = categoryBreakdown(billing, breakdownLimit);
  const counts = statusCounts(subscriptions);

  const pullToRefresh = async () => {
    setRefreshing(true);
    const result = await refresh();
    setRefreshing(false);
    if (!result.ok) {
      showFailure(result.reason);
    }
  };

  const openAdd = () => router.push("/add-subscription");
  const openInsights = () => router.navigate("/insights");
  const openList = () => router.navigate("/subscriptions");
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });

  return (
    <Screen
      scroll
      withTabBar
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={pullToRefresh}
            tintColor={theme.ink3}
          />
        ),
      }}
    >
      <T style="label" color="ink3">
        {formatMonthYear(now)}
      </T>
      <Gap size="s8" />
      {status === "loading" ? (
        <>
          <Gap size="s16" />
          <Loading rows={loadingRows} accessibilityLabel={subscriptionsCopy.list.loading} />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s16" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: subscriptionsCopy.list.retry, onPress: pullToRefresh }}
          />
        </>
      ) : subscriptions.length === 0 ? (
        <>
          <Gap size="s16" />
          <EmptyState
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{ title: copy.emptyAction, onPress: openAdd }}
          />
        </>
      ) : (
        <>
          <Money amount={formatMoney(monthlyMinor, currency)} caption={copy.perMonth} />
          <Gap size="s4" />
          <T style="caption" color="ink3">
            {count === 1
              ? copy.activeOne
              : copy.activeMany.replace("{count}", String(count))}
          </T>
          <SectionLabel
            title={copy.nextSevenDays}
            value={
              due.items.length === 0 ? undefined : formatMoney(due.totalMinor, currency)
            }
          />
          {due.items.length === 0 ? (
            <T style="caption" color="ink3">
              {copy.nothingDue}
            </T>
          ) : (
            <NativeList
              items={due.items.map((item) => ({
                key: item.subscription.id,
                title: item.subscription.name,
                subtitle: formatLedgerDate(item.nextRenewal),
                value: formatMoney(
                  item.subscription.amountMinor,
                  item.subscription.currency,
                ),
                valueNote: formatRelativeDay(item.nextRenewal, now),
                onPress: () => openDetail(item.subscription.id),
              }))}
            />
          )}
          {breakdown.length === 0 ? null : (
            <>
              <SectionLabel
                title={copy.whereItGoes}
                action={{ title: copy.insights, onPress: openInsights }}
              />
              <BarList
                items={breakdown.map((entry) => ({
                  key: entry.category,
                  label: subscriptionsCopy.categories[entry.category],
                  share: entry.share,
                  percent: `${Math.round(entry.share * percent)}%`,
                  amount: formatMoney(entry.monthlyMinor, currency),
                }))}
              />
            </>
          )}
          <Gap size="s24" />
          <T style="caption" color="ink3">
            {closingLine(counts)}
          </T>
        </>
      )}
      {alert}
    </Screen>
  );
}
