import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl } from "react-native";

import {
  BarChart,
  BarList,
  EmptyState,
  Gap,
  Loading,
  Screen,
  SectionLabel,
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
const loadingRows = 4;

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
  const currentKey = `${now.year}-${now.month}`;

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
      <T style="title" accessibilityRole="header">
        {copy.title}
      </T>
      {status === "loading" ? (
        <>
          <Gap size="s24" />
          <Loading rows={loadingRows} accessibilityLabel={subscriptionsCopy.list.loading} />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s24" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: subscriptionsCopy.list.retry, onPress: pullToRefresh }}
          />
        </>
      ) : billing.length === 0 ? (
        <>
          <Gap size="s24" />
          <EmptyState
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{ title: copy.emptyAction, onPress: openAdd }}
          />
        </>
      ) : (
        <>
          <SectionLabel
            top="s24"
            title={copy.byCategory}
            value={formatMoney(monthlyMinor, currency)}
          />
          <BarList
            items={split.map((entry) => ({
              key: entry.category,
              label: subscriptionsCopy.categories[entry.category],
              share: entry.share,
              percent: `${Math.round(entry.share * percent)}%`,
              amount: formatMoney(entry.monthlyMinor, currency),
            }))}
          />
          <SectionLabel title={copy.atAGlance} />
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
          <SectionLabel
            title={copy.byMonth}
            value={`${formatMoney(projection.averageMinor, currency)} ${copy.average}`}
          />
          <BarChart
            bars={projection.months.map((entry) => ({
              key: `${entry.month.year}-${entry.month.month}`,
              label: formatMonthShort(entry.month),
              value: entry.totalMinor,
            }))}
            average={projection.averageMinor > 0 ? projection.averageMinor : undefined}
            activeKey={currentKey}
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
