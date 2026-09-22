import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl } from "react-native";

import {
  BreakdownRow,
  EmptyState,
  Gap,
  LedgerRow,
  MoneyHero,
  Screen,
  SectionHeader,
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
import { daysBetween, today } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.overview;
const windowDays = 7;
const breakdownLimit = 3;
const accentWithinDays = 1;
const percent = 100;

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
  const { monthlyMinor, billing } = summarize(subscriptions, now, currency);
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
      <T style="title">{formatMonthYear(now)}</T>
      {status === "loading" ? (
        <>
          <Gap size="s16" />
          <EmptyState tone="ink3" body={subscriptionsCopy.list.loading} />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s16" />
          <EmptyState
            body={failureMessage(failure ?? "unknown")}
            link={{
              title: subscriptionsCopy.list.retry,
              onPress: pullToRefresh,
            }}
          />
        </>
      ) : subscriptions.length === 0 ? (
        <>
          <Gap size="s16" />
          <EmptyState
            body={copy.emptyBody}
            action={{ title: copy.emptyAction, onPress: openAdd }}
          />
        </>
      ) : (
        <>
          <Gap size="s40" />
          <MoneyHero
            size="s"
            amount={formatMoney(monthlyMinor, currency)}
            caption={copy.perMonth}
          />
          <SectionHeader
            top="s48"
            label={copy.nextSevenDays}
            caption={
              due.items.length === 0
                ? undefined
                : formatMoney(due.totalMinor, currency)
            }
          />
          {due.items.length === 0 ? (
            <T style="body" color="ink3">
              {copy.nothingDue}
            </T>
          ) : (
            due.items.map((item, index) => (
              <LedgerRow
                key={item.subscription.id}
                date={formatLedgerDate(item.nextRenewal)}
                name={item.subscription.name}
                amount={formatMoney(
                  item.subscription.amountMinor,
                  item.subscription.currency,
                )}
                note={formatRelativeDay(item.nextRenewal, now)}
                noteTone={
                  index === 0 &&
                  daysBetween(now, item.nextRenewal) <= accentWithinDays
                    ? "accent"
                    : "ink3"
                }
                last={index === due.items.length - 1}
                onPress={() => openDetail(item.subscription.id)}
              />
            ))
          )}
          {breakdown.length === 0 ? null : (
            <>
              <SectionHeader
                label={copy.whereItGoes}
                caption={copy.insights}
                onPressCaption={openInsights}
              />
              {breakdown.map((entry, index) => (
                <BreakdownRow
                  key={entry.category}
                  name={subscriptionsCopy.categories[entry.category]}
                  share={`${Math.round(entry.share * percent)}%`}
                  amount={formatMoney(entry.monthlyMinor, currency)}
                  last={index === breakdown.length - 1}
                />
              ))}
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
