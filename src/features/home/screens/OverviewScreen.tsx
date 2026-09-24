import { router } from "expo-router";
import { View } from "react-native";

import {
  AnimatedMoney,
  EmptyState,
  Entering,
  Gap,
  Loading,
  Logo,
  LogoRow,
  PillRow,
  Screen,
  SectionHeading,
  StatList,
  T,
  Tile,
  layout,
  useThemeName,
  type StatItem,
} from "@/design";
import { useProfile } from "@/features/profile";
import {
  failureMessage,
  formatCycleAdverb,
  formatLedgerDate,
  formatRelativeTitle,
  monthCharges,
  statusCounts,
  subscriptionLogo,
  subscriptionsCopy,
  summarize,
  usePullToRefresh,
  useSubscriptionAlert,
  useSubscriptions,
  useToday,
} from "@/features/subscriptions";
import { daysInMonth } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { homeCopy } from "../copy";

const copy = homeCopy.overview;
const upNextLimit = 5;
const loadingRows = 4;

export function OverviewScreen() {
  const themeName = useThemeName();
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const pull = usePullToRefresh(refresh, showFailure);

  const now = useToday();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, yearlyMinor, billing, count } = summarize(
    subscriptions,
    now,
    currency,
  );
  const counts = statusCounts(subscriptions);
  const trials = billing.filter((item) => item.status === "trial").length;
  const month = monthCharges(billing, now);
  const monthEnd = { ...now, day: daysInMonth(now.year, now.month) };
  const next = billing[0];
  const upNext = billing.slice(0, upNextLimit);


  const openAdd = () => router.push("/add-subscription");
  const openInsights = () => router.push("/insights");
  const openList = () => router.push("/subscriptions");
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });

  const stats: StatItem[] = [
    { key: "active", label: copy.active, value: String(counts.active) },
  ];
  if (trials > 0) {
    stats.push({ key: "trials", label: copy.trials, value: String(trials) });
  }
  if (counts.paused > 0) {
    stats.push({ key: "paused", label: copy.paused, value: String(counts.paused) });
  }
  if (counts.cancelled > 0) {
    stats.push({
      key: "cancelled",
      label: copy.cancelled,
      value: String(counts.cancelled),
    });
  }
  stats.push({
    key: "year",
    label: copy.aYear,
    value: formatMoney(yearlyMinor, currency),
  });

  return (
    <Screen scroll withTabBar refresh={pull}>
      {status === "loading" ? (
        <Loading
          variant="hero"
          rows={loadingRows}
          accessibilityLabel={subscriptionsCopy.list.loading}
        />
      ) : status === "error" ? (
        <>
          <Gap size="s32" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: subscriptionsCopy.list.retry, onPress: pull.onRefresh }}
          />
        </>
      ) : subscriptions.length === 0 ? (
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
          <Entering index={0}>
            <T style="label" color="ink3">
              {copy.thisMonth}
            </T>
            <Gap size="s4" />
            <AnimatedMoney amount={formatMoney(monthlyMinor, currency)} />
            <Gap size="s4" />
            <T style="caption" color="ink3">
              {count === 1
                ? copy.perMonthOne
                : copy.perMonthMany.replace("{count}", String(count))}
            </T>
            <Gap size="s24" />
            <PillRow
              buttons={[
                { title: copy.add, onPress: openAdd },
                { title: copy.insights, onPress: openInsights, variant: "secondary" },
              ]}
            />
          </Entering>
          <Gap size="s24" />
          <Entering index={1}>
            <View style={{ flexDirection: "row", gap: layout.pill.gap }}>
              {next === undefined ? (
                <Tile
                  label={copy.upNext}
                  value={copy.nothingDue}
                  caption={copy.nothingDueCaption}
                />
              ) : (
                <Tile
                  tone="accent"
                  label={next.subscription.name}
                  leading={
                    <Logo
                      {...subscriptionLogo(next.subscription, themeName, "tiny")}
                      size="tiny"
                    />
                  }
                  value={formatMoney(
                    next.subscription.amountMinor,
                    next.subscription.currency,
                  )}
                  caption={`${formatRelativeTitle(next.nextRenewal, now)} · ${formatCycleAdverb(next.subscription.cycle)}`}
                  onPress={() => openDetail(next.subscription.id)}
                />
              )}
              <Tile
                label={copy.stillToCome}
                value={formatMoney(month.totalMinor, currency)}
                caption={(month.count === 1 ? copy.chargesOne : copy.chargesMany)
                  .replace("{count}", String(month.count))
                  .replace("{date}", formatLedgerDate(monthEnd))}
              />
            </View>
          </Entering>
          <Entering index={2}>
            <SectionHeading
              title={copy.upNext}
              action={{ title: copy.seeAll, onPress: openList }}
            />
            {upNext.length === 0 ? (
              <T style="body" color="ink3">
                {copy.nothingThisWeek}
              </T>
            ) : (
              upNext.map((item) => (
                <LogoRow
                  key={item.subscription.id}
                  title={item.subscription.name}
                  subtitle={`${formatRelativeTitle(item.nextRenewal, now)} · ${formatCycleAdverb(item.subscription.cycle)}`}
                  value={formatMoney(
                    item.subscription.amountMinor,
                    item.subscription.currency,
                  )}
                  logo={subscriptionLogo(item.subscription, themeName, "row")}
                  onPress={() => openDetail(item.subscription.id)}
                />
              ))
            )}
          </Entering>
          <Entering index={3}>
            <SectionHeading title={copy.thisMonth} />
            <StatList items={stats} />
          </Entering>
        </>
      )}
      {alert}
    </Screen>
  );
}
