import { Stack, router } from "expo-router";
import { useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import {
  EmptyState,
  Gap,
  Loading,
  NativeList,
  Screen,
  SectionLabel,
  T,
  Tabs,
  icons,
  useTheme,
  type TabOption,
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
  filterBySearch,
  groupLedger,
  listFilters,
  listSorts,
  searchTerms,
  sortByNextRenewal,
  sortLedger,
  summarize,
  type LedgerGroup,
  type ListFilter,
  type ListSort,
  type UpcomingSubscription,
} from "../selectors";
import { readSortPreference, writeSortPreference } from "../sortPreference";
import { useSubscriptions } from "../SubscriptionsProvider";
import { useSubscriptionAlert } from "../useSubscriptionAlert";

const copy = subscriptionsCopy.list;
const loadingRows = 6;

const filterOptions: readonly TabOption<ListFilter>[] = listFilters.map(
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

function groupLabel(group: LedgerGroup): string | null {
  if (group.kind === "list") {
    return null;
  }
  if (group.kind === "month") {
    return formatMonth(group.month);
  }
  return group.status === "paused" ? copy.groupPaused : copy.groupCancelled;
}

function categoryLabel(category: keyof typeof subscriptionsCopy.categories): string {
  return subscriptionsCopy.categories[category];
}

export function SubscriptionsScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const [filter, setFilter] = useState<ListFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<ListSort>(readSortPreference);
  const [query, setQuery] = useState("");
  const searchBar = useRef<SearchBarCommands>(null);

  const now = today();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, count } = summarize(subscriptions, now, currency);
  const terms = searchTerms(query);
  const groups = groupLedger(
    sortLedger(
      filterBySearch(
        applyListFilter(sortByNextRenewal(subscriptions, now), filter),
        terms,
        categoryLabel,
      ),
      sort,
    ),
    currency,
    sort,
  );
  const hasList = status === "ready" && subscriptions.length > 0;

  const changeSort = (next: ListSort) => {
    setSort(next);
    writeSortPreference(next);
  };
  const clearSearch = () => {
    searchBar.current?.clearText();
    setQuery("");
  };

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
      header
      scrollViewProps={{
        contentInsetAdjustmentBehavior: "automatic",
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={pullToRefresh}
            tintColor={theme.ink3}
          />
        ),
      }}
    >
      {hasList ? (
        <Stack.SearchBar
          ref={searchBar}
          placeholder={copy.searchPlaceholder}
          autoCapitalize="none"
          hideWhenScrolling={false}
          obscureBackground={false}
          onChangeText={(event) => setQuery(event.nativeEvent.text)}
          onCancelButtonPress={() => setQuery("")}
        />
      ) : null}
      <Stack.Toolbar placement="right">
        {hasList ? (
          <Stack.Toolbar.Menu icon={icons.sort} accessibilityLabel={copy.sortLabel}>
            {listSorts.map((value) => (
              <Stack.Toolbar.MenuAction
                key={value}
                isOn={sort === value}
                onPress={() => changeSort(value)}
              >
                {copy.sorts[value]}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        ) : null}
        <Stack.Toolbar.Button
          icon={icons.add}
          onPress={openAdd}
          accessibilityLabel={copy.add}
        />
      </Stack.Toolbar>
      {status === "loading" ? (
        <>
          <Gap size="s24" />
          <Loading rows={loadingRows} accessibilityLabel={copy.loading} />
        </>
      ) : status === "error" ? (
        <>
          <Gap size="s24" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: copy.retry, onPress: pullToRefresh }}
          />
        </>
      ) : subscriptions.length === 0 ? (
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
          <T style="caption" color="ink3">
            {copy.activeCaption
              .replace("{count}", String(count))
              .replace("{amount}", formatMoney(monthlyMinor, currency))}
          </T>
          <Gap size="s24" />
          <Tabs options={filterOptions} value={filter} onChange={setFilter} />
          {groups.length === 0 && terms.length > 0 ? (
            <>
              <Gap size="s24" />
              <EmptyState
                title={copy.searchEmpty.replace("{query}", query.trim())}
                body={copy.searchEmptyBody}
                link={{ title: copy.clearSearch, onPress: clearSearch }}
              />
            </>
          ) : groups.length === 0 ? (
            <>
              <Gap size="s24" />
              <EmptyState
                title={copy.filterEmpty.replace(
                  "{filter}",
                  copy.filters[filter].toLocaleLowerCase(),
                )}
                link={{ title: copy.showAll, onPress: () => setFilter("all") }}
              />
            </>
          ) : (
            groups.map((group) => (
              <View key={group.key}>
                {group.kind === "list" ? (
                  <Gap size="s24" />
                ) : (
                  <SectionLabel
                    top="s24"
                    title={groupLabel(group) ?? ""}
                    value={
                      group.kind === "month"
                        ? formatMoney(group.totalMinor, currency)
                        : undefined
                    }
                  />
                )}
                <NativeList
                  items={group.items.map((item) => ({
                    key: item.subscription.id,
                    title: item.subscription.name,
                    subtitle: formatLedgerDate(item.nextRenewal),
                    value: formatMoney(
                      displayAmountMinor(item.subscription),
                      item.subscription.currency,
                    ),
                    valueNote: rowNote(item),
                    tone: group.kind === "status" ? "ink2" : "ink",
                    onPress: () => openDetail(item.subscription.id),
                  }))}
                />
              </View>
            ))
          )}
        </>
      )}
      {alert}
    </Screen>
  );
}
