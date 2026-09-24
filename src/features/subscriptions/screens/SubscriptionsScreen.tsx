import { Stack, router } from "expo-router";
import { useDeferredValue, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import {
  Appear,
  EmptyState,
  Entering,
  Gap,
  Loading,
  LogoRow,
  ScreenList,
  SectionHeading,
  Segmented,
  T,
  icons,
  useThemeName,
  type ChipTone,
  type SegmentOption,
  type ThemeName,
} from "@/design";
import { useProfile } from "@/features/profile";
import { daysBetween, type CalendarDate } from "@/lib/calendar";
import { fallbackCurrency, formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { failureMessage } from "../errors";
import {
  formatLedgerDate,
  formatMonth,
  formatRelativeTitle,
  subscriptionLogo,
} from "../format";
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
import { usePullToRefresh } from "../usePullToRefresh";
import { useSubscriptionAlert } from "../useSubscriptionAlert";
import { useToday } from "../useToday";

const copy = subscriptionsCopy.list;
const loadingRows = 6;
const enteringItems = 8;
const soonDays = 1;

const filterOptions: readonly SegmentOption<ListFilter>[] = listFilters.map(
  (value) => ({ value, label: copy.filters[value] }),
);

function rowChip(
  item: UpcomingSubscription,
  now: CalendarDate,
): { label: string; tone: ChipTone } | undefined {
  if (item.status === "trial") {
    return { label: copy.trialNote, tone: "accent" };
  }
  if (item.status === "active" && daysBetween(now, item.nextRenewal) <= soonDays) {
    return { label: formatRelativeTitle(item.nextRenewal, now), tone: "accent" };
  }
  if (item.status === "paused") {
    return { label: copy.groupPaused, tone: "neutral" };
  }
  if (item.status === "cancelled") {
    return { label: copy.groupCancelled, tone: "neutral" };
  }
  return undefined;
}

function rowNote(item: UpcomingSubscription): string | undefined {
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

type ListItem =
  | { kind: "heading"; key: string; group: LedgerGroup }
  | { kind: "gap"; key: string }
  | {
      kind: "row";
      key: string;
      item: UpcomingSubscription;
      muted: boolean;
    };

function flatten(groups: readonly LedgerGroup[]): ListItem[] {
  return groups.flatMap((group): ListItem[] => [
    group.kind === "list"
      ? { kind: "gap", key: `gap-${group.key}` }
      : { kind: "heading", key: `heading-${group.key}`, group },
    ...group.items.map(
      (item): ListItem => ({
        kind: "row",
        key: item.subscription.id,
        item,
        muted: group.kind === "status",
      }),
    ),
  ]);
}

type SubscriptionRowProps = {
  item: UpcomingSubscription;
  muted: boolean;
  highlight: boolean;
  now: CalendarDate;
  themeName: ThemeName;
  onOpen: (id: string) => void;
};

function SubscriptionRow({
  item,
  muted,
  highlight,
  now,
  themeName,
  onOpen,
}: SubscriptionRowProps) {
  return (
    <LogoRow
      title={item.subscription.name}
      subtitle={formatLedgerDate(item.nextRenewal)}
      value={formatMoney(
        displayAmountMinor(item.subscription),
        item.subscription.currency,
      )}
      valueNote={rowNote(item)}
      chip={rowChip(item, now)}
      logo={{
        ...subscriptionLogo(item.subscription, themeName, "row"),
        muted,
      }}
      tone={muted ? "ink2" : "ink"}
      highlight={highlight}
      onPress={() => onOpen(item.subscription.id)}
    />
  );
}

function categoryLabel(category: keyof typeof subscriptionsCopy.categories): string {
  return subscriptionsCopy.categories[category];
}

export function SubscriptionsScreen() {
  const themeName = useThemeName();
  const { profile } = useProfile();
  const { status, failure, subscriptions, recentId, refresh } =
    useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();
  const pull = usePullToRefresh(refresh, showFailure);
  const [filter, setFilter] = useState<ListFilter>("all");
  const [sort, setSort] = useState<ListSort>(readSortPreference);
  const [query, setQuery] = useState("");
  const searchBar = useRef<SearchBarCommands>(null);

  const now = useToday();
  const currency =
    profile?.currency ?? subscriptions[0]?.currency ?? fallbackCurrency;
  const { monthlyMinor, count } = summarize(subscriptions, now, currency);
  const deferredQuery = useDeferredValue(query);
  const terms = searchTerms(deferredQuery);
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
  const items = hasList ? flatten(groups) : [];

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

  const renderItem = (entry: ListItem, index: number) => {
    const content =
      entry.kind === "gap" ? (
        <Gap size="s16" />
      ) : entry.kind === "heading" ? (
        <SectionHeading
          top="s24"
          title={groupLabel(entry.group) ?? ""}
          value={
            entry.group.kind === "month"
              ? formatMoney(entry.group.totalMinor, currency)
              : undefined
          }
        />
      ) : (
        <SubscriptionRow
          item={entry.item}
          muted={entry.muted}
          highlight={entry.item.subscription.id === recentId}
          now={now}
          themeName={themeName}
          onOpen={openDetail}
        />
      );
    return index < enteringItems ? (
      <Entering index={index}>{content}</Entering>
    ) : (
      <Appear>{content}</Appear>
    );
  };

  const header = (
    <>
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
          <Gap size="s32" />
          <EmptyState
            title={copy.errorTitle}
            body={failureMessage(failure ?? "unknown")}
            link={{ title: copy.retry, onPress: pull.onRefresh }}
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
          <T style="caption" color="ink3">
            {copy.activeCaption
              .replace("{count}", String(count))
              .replace("{amount}", formatMoney(monthlyMinor, currency))}
          </T>
          <Gap size="s16" />
          <Segmented options={filterOptions} value={filter} onChange={setFilter} />
          {groups.length === 0 && terms.length > 0 ? (
            <>
              <Gap size="s32" />
              <EmptyState
                title={copy.searchEmpty.replace("{query}", deferredQuery.trim())}
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
          ) : null}
        </>
      )}
      {alert}
    </>
  );

  return (
    <ScreenList
      data={items}
      keyExtractor={(entry) => entry.key}
      renderItem={renderItem}
      header={header}
      underHeader
      automaticInsets
      refresh={pull}
    />
  );
}
