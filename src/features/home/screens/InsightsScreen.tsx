import { router } from "expo-router";
import { useState } from "react";

import {
  AnimatedMoney,
  BarChart,
  EmptyState,
  Entering,
  Gap,
  Loading,
  Screen,
  SectionHeading,
  Segmented,
  ShareBar,
  StatList,
  T,
  type SegmentOption,
  type StatItem,
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
  usePullToRefresh,
  useSubscriptionAlert,
  useSubscriptions,
  yearlyAmountMinor,
  type UpcomingSubscription,
} from "@/features/subscriptions";
import { today } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.insights;
const categoryLimit = 10;
const projectionMonths = 12;
const percent = 100;
const loadingRows = 4;

type View = "months" | "categories";

const views: readonly SegmentOption<View>[] = [
  { value: "months", label: copy.months },
  { value: "categories", label: copy.categories },
];

function monthKey(date: { year: number; month: number }): string {
  return `${date.year}-${date.month}`;
}

function categoryCount(
  billing: readonly UpcomingSubscription[],
  category: string,
): number {
  return billing.filter(
    (item) => (item.subscription.category ?? "other") === category,
  ).length;
}

export function InsightsScreen() {
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const pull = usePullToRefresh(refresh, showFailure);
  const [view, setView] = useState<View>("months");

  const now = today();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, yearlyMinor, billing } = summarize(
    subscriptions,
    now,
    currency,
  );
  const split = categorySplit(billing, categoryLimit);
  const projection = projectMonthly(billing, now, projectionMonths);
  const priciest = mostExpensive(billing);
  const totals = projection.months.map((entry) => entry.totalMinor);
  const highest = projection.months[totals.indexOf(Math.max(...totals))];
  const lowest = projection.months[totals.indexOf(Math.min(...totals))];

  const openAdd = () => router.push("/add-subscription");

  const monthStats: StatItem[] = [
    {
      key: "average",
      label: copy.average,
      value: formatMoney(projection.averageMinor, currency),
    },
    {
      key: "highest",
      label: copy.highest,
      value: formatMoney(highest.totalMinor, currency),
      note: formatMonthShort(highest.month),
    },
    {
      key: "lowest",
      label: copy.lowest,
      value: formatMoney(lowest.totalMinor, currency),
      note: formatMonthShort(lowest.month),
    },
  ];

  const facts: StatItem[] =
    priciest === null
      ? []
      : [
          {
            key: "priciest",
            label: copy.priciest,
            value: priciest.subscription.name,
          },
          {
            key: "save",
            label: copy.wouldSave,
            value: formatMoney(yearlyAmountMinor(priciest.subscription), currency),
            note: copy.perYear,
          },
        ];

  return (
    <Screen scroll withTabBar refresh={pull}>
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
          <Gap size="s32" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: subscriptionsCopy.list.retry, onPress: pull.onRefresh }}
          />
        </>
      ) : billing.length === 0 ? (
        <>
          <Gap size="s32" />
          <EmptyState
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{ title: copy.emptyAction, onPress: openAdd }}
          />
        </>
      ) : (
        <>
          <Gap size="s24" />
          <Entering index={0}>
            <T style="label" color="ink3">
              {copy.yearEyebrow}
            </T>
            <Gap size="s4" />
            <AnimatedMoney amount={formatMoney(yearlyMinor, currency)} size="display" />
            <Gap size="s4" />
            <T style="caption" color="ink3">
              {copy.perMonthCaption.replace("{monthly}", formatMoney(monthlyMinor, currency))}
            </T>
            <Gap size="s24" />
            <Segmented options={views} value={view} onChange={setView} />
          </Entering>
          <Gap size="s32" />
          {view === "months" ? (
            <Entering index={1}>
              <BarChart
                bars={projection.months.map((entry) => ({
                  key: monthKey(entry.month),
                  label: formatMonthShort(entry.month),
                  value: entry.totalMinor,
                  amount: formatMoney(entry.totalMinor, currency),
                }))}
                activeKey={monthKey(now)}
                accessibilityLabel={copy.chart}
              />
              <Gap size="s32" />
              <StatList items={monthStats} />
            </Entering>
          ) : (
            <Entering index={1}>
              {split.map((entry, index) => {
                const count = categoryCount(billing, entry.category);
                return (
                  <ShareBar
                    key={entry.category}
                    active={index === 0}
                    label={subscriptionsCopy.categories[entry.category]}
                    amount={formatMoney(entry.monthlyMinor, currency)}
                    share={entry.share}
                    caption={(count === 1
                      ? copy.categoryCaptionOne
                      : copy.categoryCaptionMany
                    )
                      .replace("{share}", String(Math.round(entry.share * percent)))
                      .replace("{count}", String(count))}
                  />
                );
              })}
              {facts.length === 0 ? null : (
                <>
                  <SectionHeading title={copy.facts} />
                  <StatList items={facts} />
                </>
              )}
            </Entering>
          )}
        </>
      )}
      {alert}
    </Screen>
  );
}
