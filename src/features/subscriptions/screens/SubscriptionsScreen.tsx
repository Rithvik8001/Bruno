import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, View } from "react-native";

import {
  EmptyState,
  FilterTabs,
  Gap,
  LedgerRow,
  NativeIconButton,
  Screen,
  SectionHeader,
  Spacer,
  T,
  layout,
  useTheme,
  type FilterOption,
} from "@/design";
import { useProfile } from "@/features/profile";
import { today } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { failureMessage } from "../errors";
import { formatLedgerDate, formatMonth } from "../format";
import {
  applyListFilter,
  displayAmountMinor,
  groupLedger,
  listFilters,
  sortByNextRenewal,
  summarize,
  type LedgerGroup,
  type ListFilter,
  type UpcomingSubscription,
} from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import { useSubscriptionAlert } from "../useSubscriptionAlert";

const copy = subscriptionsCopy.list;

const filterOptions: readonly FilterOption<ListFilter>[] = listFilters.map(
  (value) => ({ value, label: copy.filters[value] }),
);

function rowNote(item: UpcomingSubscription): string | undefined {
  if (item.status === "trial") {
    return copy.trialNote;
  }
  if (item.subscription.cycle.unit === "year") {
    return copy.yearNote.replace(
      "{amount}",
      formatMoney(item.subscription.amountMinor, item.subscription.currency),
    );
  }
  return undefined;
}

function groupLabel(group: LedgerGroup): string {
  if (group.kind === "month") {
    return formatMonth(group.month);
  }
  return group.status === "paused" ? copy.groupPaused : copy.groupCancelled;
}

export function SubscriptionsScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [filter, setFilter] = useState<ListFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const now = today();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, count } = summarize(subscriptions, now, currency);
  const groups = groupLedger(
    applyListFilter(sortByNextRenewal(subscriptions, now), filter),
  );

  const openAdd = () => router.push("/add-subscription");
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });
  const pullToRefresh = async () => {
    setRefreshing(true);
    const result = await refresh();
    setRefreshing(false);
    if (!result.ok) {
      showFailure(result.reason);
    }
  };

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <T style="title">{copy.title}</T>
        <NativeIconButton
          icon="add"
          onPress={openAdd}
          accessibilityLabel={copy.add}
        />
      </View>
      {status === "loading" ? (
        <>
          <Gap size="s16" />
          <EmptyState tone="ink3" body={copy.loading} />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s16" />
          <EmptyState
            body={failureMessage(failure ?? "unknown")}
            link={{ title: copy.retry, onPress: pullToRefresh }}
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
          <Spacer height={layout.list.captionGap} />
          <T style="caption" color="ink3">
            {copy.activeCaption
              .replace("{count}", String(count))
              .replace("{amount}", formatMoney(monthlyMinor, currency))}
          </T>
          <Gap size="s32" />
          <FilterTabs
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
          {groups.map((group) => (
            <View key={group.key}>
              <SectionHeader
                top="s32"
                bottom="tight"
                label={groupLabel(group)}
                caption={
                  group.kind === "month"
                    ? formatMoney(group.totalMinor, currency)
                    : undefined
                }
              />
              {group.items.map((item, index) => (
                <LedgerRow
                  key={item.subscription.id}
                  dense
                  date={formatLedgerDate(item.nextRenewal)}
                  name={item.subscription.name}
                  amount={formatMoney(
                    displayAmountMinor(item.subscription),
                    item.subscription.currency,
                  )}
                  note={rowNote(item)}
                  last={index === group.items.length - 1}
                  onPress={() => openDetail(item.subscription.id)}
                />
              ))}
            </View>
          ))}
        </>
      )}
      {alert}
    </Screen>
  );
}
