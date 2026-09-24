import { router } from "expo-router";

import {
  AnimatedMoney,
  Appear,
  Divider,
  EmptyState,
  Entering,
  Gap,
  Invite,
  Loading,
  LogoRow,
  PillLink,
  PillRow,
  Screen,
  SectionHeading,
  Spacer,
  StatList,
  T,
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
  const { status, failure, subscriptions, recentId, refresh } =
    useSubscriptions();
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
  const upNext = billing.slice(0, upNextLimit);

  const openAdd = () => router.push("/add-subscription");
  const openInsights = () => router.push("/insights");
  const openList = () => router.push("/subscriptions");
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });

  const stats: StatItem[] = [
    {
      key: "toCome",
      label: copy.stillToCome,
      value: formatMoney(month.totalMinor, currency),
      note: (month.count === 1 ? copy.chargesOne : copy.chargesMany)
        .replace("{count}", String(month.count))
        .replace("{date}", formatLedgerDate(monthEnd)),
    },
    { key: "active", label: copy.active, value: String(counts.active) },
  ];
  if (trials > 0) {
    stats.push({ key: "trials", label: copy.trials, value: String(trials) });
  }
  if (counts.paused > 0) {
    stats.push({
      key: "paused",
      label: copy.paused,
      value: String(counts.paused),
    });
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
    <Screen
      scroll
      fill={status === "ready" && subscriptions.length === 0}
      withTabBar
      refresh={pull}
    >
      <T style="title" accessibilityRole="header">
        {homeCopy.tabs.overview}
      </T>
      {status === "loading" ? (
        <>
          <Gap size="s24" />
          <Loading
            variant="hero"
            rows={loadingRows}
            accessibilityLabel={subscriptionsCopy.list.loading}
          />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s32" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{
              title: subscriptionsCopy.list.retry,
              onPress: pull.onRefresh,
            }}
          />
        </>
      ) : subscriptions.length === 0 ? (
        <Invite
          icon={copy.invite.icon}
          title={copy.invite.title}
          body={copy.invite.body}
          benefits={copy.invite.benefits}
          action={{ title: copy.invite.action, onPress: openAdd }}
        />
      ) : (
        <>
          <Entering index={0}>
            <Spacer height={layout.hero.top} />
            <AnimatedMoney amount={formatMoney(monthlyMinor, currency)} />
            <Gap size="s4" />
            <T style="caption" color="ink3">
              {count === 1
                ? copy.perMonthOne
                : copy.perMonthMany.replace("{count}", String(count))}
            </T>
            <Spacer height={layout.hero.gap} />
            <PillLink title={copy.insights} onPress={openInsights} />
            <Spacer height={layout.hero.actionsTop} />
            <PillRow
              buttons={[
                { title: copy.add, onPress: openAdd },
                { title: copy.seeAll, onPress: openList, variant: "secondary" },
              ]}
            />
          </Entering>
          <Entering index={1}>
            <SectionHeading title={copy.upNext} bottom="s4" />
            {upNext.length === 0 ? (
              <>
                <Gap size="s8" />
                <T style="body" color="ink3">
                  {copy.nothingThisWeek}
                </T>
              </>
            ) : (
              upNext.map((item) => (
                <Appear key={item.subscription.id}>
                  <LogoRow
                    title={item.subscription.name}
                    subtitle={`${formatRelativeTitle(item.nextRenewal, now)} · ${formatCycleAdverb(item.subscription.cycle)}`}
                    value={formatMoney(
                      item.subscription.amountMinor,
                      item.subscription.currency,
                    )}
                    logo={subscriptionLogo(item.subscription, themeName, "row")}
                    highlight={item.subscription.id === recentId}
                    onPress={() => openDetail(item.subscription.id)}
                  />
                </Appear>
              ))
            )}
          </Entering>
          <Entering index={2}>
            <Divider />
            <SectionHeading top={null} title={copy.thisMonth} bottom="s4" />
            <StatList items={stats} />
          </Entering>
        </>
      )}
      {alert}
    </Screen>
  );
}
