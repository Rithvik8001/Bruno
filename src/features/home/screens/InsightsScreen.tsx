import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl } from "react-native";

import {
  BarChart,
  BreakdownRow,
  DonutChart,
  EmptyState,
  Gap,
  Screen,
  SectionHeader,
  StatRow,
  T,
  useTheme,
} from "@/design";
import { useProfile } from "@/features/profile";
import {
  categorySplit,
  failureMessage,
  formatMonthShort,
  mostExpensive,
  projectMonthly,
  subscriptionsCopy,
  summarize,
  useSubscriptionAlert,
  useSubscriptions,
  yearlyAmountMinor,
  type CategoryShare,
  type UpcomingSubscription,
} from "@/features/subscriptions";
import { today } from "@/lib/calendar";
import {
  fallbackCurrency,
  formatMoney,
  monthlyAmountMinor,
} from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.insights;
const categoryLimit = 5;
const projectionMonths = 12;
const percent = 100;

function closingLine(
  count: number,
  split: readonly CategoryShare[],
  priciest: UpcomingSubscription | null,
  currency: string,
): string {
  const parts: string[] = [];
  if (count > 1 && split.length > 1) {
    parts.push(
      copy.shareLine
        .replace("{category}", subscriptionsCopy.categories[split[0].category])
        .replace("{share}", String(Math.round(split[0].share * percent))),
    );
  }
  if (priciest !== null) {
    parts.push(
      copy.saveLine
        .replace("{name}", priciest.subscription.name)
        .replace(
          "{amount}",
          formatMoney(yearlyAmountMinor(priciest.subscription), currency),
        ),
    );
  }
  return parts.join(" ");
}

export function InsightsScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [refreshing, setRefreshing] = useState(false);

  const now = today();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, yearlyMinor, count, billing } = summarize(
    subscriptions,
    now,
    currency,
  );
  const split = categorySplit(billing, categoryLimit);
  const projection = projectMonthly(billing, now, projectionMonths);
  const priciest = mostExpensive(billing);

  const pullToRefresh = async () => {
    setRefreshing(true);
    const result = await refresh();
    setRefreshing(false);
    if (!result.ok) {
      showFailure(result.reason);
    }
  };

  const openAdd = () => router.push("/add-subscription");

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
      <T style="title">{copy.title}</T>
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
      ) : billing.length === 0 ? (
        <>
          <Gap size="s16" />
          <EmptyState
            body={copy.emptyBody}
            action={{ title: copy.emptyAction, onPress: openAdd }}
          />
        </>
      ) : (
        <>
          <SectionHeader top="s40" label={copy.byCategory} />
          <DonutChart
            slices={split.map((entry, index) => ({
              key: entry.category,
              value: entry.monthlyMinor,
              color: theme.chart[index] ?? theme.chart[theme.chart.length - 1],
            }))}
            amount={formatMoney(monthlyMinor, currency)}
            caption={homeCopy.overview.perMonth}
          />
          <Gap size="s16" />
          {split.map((entry, index) => (
            <BreakdownRow
              key={entry.category}
              swatch={theme.chart[index] ?? theme.chart[theme.chart.length - 1]}
              name={subscriptionsCopy.categories[entry.category]}
              share={`${Math.round(entry.share * percent)}%`}
              amount={formatMoney(entry.monthlyMinor, currency)}
              last={index === split.length - 1}
            />
          ))}
          <Gap size="s24" />
          <StatRow
            cells={[
              { value: formatMoney(yearlyMinor, currency), label: copy.perYear },
              ...(priciest === null
                ? []
                : [
                    {
                      value: formatMoney(
                        monthlyAmountMinor(
                          priciest.subscription.amountMinor,
                          priciest.subscription.cycle,
                        ),
                        currency,
                      ),
                      label: priciest.subscription.name,
                    },
                  ]),
              { value: String(count), label: copy.active },
            ]}
          />
          <SectionHeader
            label={copy.byMonth}
            caption={`${formatMoney(projection.averageMinor, currency)} ${copy.average}`}
          />
          <BarChart
            bars={projection.months.map((entry) => ({
              key: `${entry.month.year}-${entry.month.month}`,
              label: formatMonthShort(entry.month),
              value: entry.totalMinor,
            }))}
            average={
              projection.averageMinor > 0 ? projection.averageMinor : undefined
            }
          />
          <Gap size="s24" />
          <T style="caption" color="ink3">
            {closingLine(count, split, priciest, currency)}
          </T>
        </>
      )}
      {alert}
    </Screen>
  );
}
