import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl } from "react-native";

import {
  Gap,
  LedgerRow,
  NavRow,
  Pill,
  Screen,
  T,
  TextLink,
  useTheme,
} from "@/design";
import { today } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { failureMessage } from "../errors";
import { formatLedgerDate } from "../format";
import { sortByNextRenewal, type UpcomingSubscription } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";

function rowNote(item: UpcomingSubscription): string | undefined {
  switch (item.status) {
    case "trial":
      return subscriptionsCopy.list.trialNote;
    case "paused":
      return subscriptionsCopy.list.pausedNote;
    case "cancelled":
      return subscriptionsCopy.list.cancelledNote;
    case "active":
      return undefined;
  }
}

export function SubscriptionsScreen() {
  const copy = subscriptionsCopy.list;
  const theme = useTheme();
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const [refreshing, setRefreshing] = useState(false);

  const items = sortByNextRenewal(subscriptions, today());
  const openAdd = () => router.push("/add-subscription");
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });

  const pull = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <Screen
      scroll
      withTabBar
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={pull}
            tintColor={theme.ink3}
          />
        ),
      }}
    >
      <NavRow action={{ title: copy.add, onPress: openAdd }} />
      <Gap size="s32" />
      <T style="title">{copy.title}</T>
      <Gap size="s32" />
      {status === "loading" ? (
        <T style="body" color="ink3">
          {copy.loading}
        </T>
      ) : status === "error" ? (
        <>
          <T style="body" color="ink2">
            {failureMessage(failure ?? "unknown")}
          </T>
          <Gap size="s8" />
          <TextLink title={copy.retry} onPress={pull} />
        </>
      ) : items.length === 0 ? (
        <>
          <T style="body" color="ink2">
            {copy.emptyBody}
          </T>
          <Gap size="s32" />
          <Pill title={copy.emptyAction} onPress={openAdd} />
        </>
      ) : (
        items.map((item, index) => (
          <LedgerRow
            key={item.subscription.id}
            date={formatLedgerDate(item.nextRenewal)}
            name={item.subscription.name}
            amount={formatMoney(
              item.subscription.amountMinor,
              item.subscription.currency,
            )}
            note={rowNote(item)}
            noteTone={item.status === "trial" ? "accent" : "ink3"}
            last={index === items.length - 1}
            onPress={() => openDetail(item.subscription.id)}
          />
        ))
      )}
    </Screen>
  );
}
