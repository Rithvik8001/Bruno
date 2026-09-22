import { router } from "expo-router";
import { View } from "react-native";

import {
  Gap,
  LedgerList,
  NavRow,
  Pill,
  Screen,
  T,
  TextLink,
  layout,
} from "@/design";
import { today } from "@/lib/calendar";
import { formatMoney } from "@/lib/money";

import { subscriptionsCopy } from "../copy";
import { failureMessage } from "../errors";
import { formatLedgerDate } from "../format";
import { sortByNextRenewal, type UpcomingSubscription } from "../selectors";
import { useSubscriptions } from "../SubscriptionsProvider";
import { useSubscriptionAlert } from "../useSubscriptionAlert";

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
  const { status, failure, subscriptions, refresh } = useSubscriptions();
  const { alert, showFailure } = useSubscriptionAlert();

  const items = sortByNextRenewal(subscriptions, today());
  const openAdd = () => router.push("/add-subscription");
  const pullToRefresh = async () => {
    const result = await refresh();
    if (!result.ok) {
      showFailure(result.reason);
    }
  };
  const openDetail = (id: string) =>
    router.push({ pathname: "/subscription", params: { id } });

  return (
    <Screen withTabBar padded={false}>
      <View style={{ paddingHorizontal: layout.margin }}>
        <NavRow action={{ title: copy.add, onPress: openAdd }} />
        <Gap size="s32" />
        <T style="title">{copy.title}</T>
        <Gap size="s20" />
      </View>
      {status === "loading" ? (
        <View style={{ paddingHorizontal: layout.margin }}>
          <T style="body" color="ink3">
            {copy.loading}
          </T>
        </View>
      ) : status === "error" ? (
        <View style={{ paddingHorizontal: layout.margin }}>
          <T style="body" color="ink2">
            {failureMessage(failure ?? "unknown")}
          </T>
          <Gap size="s8" />
          <TextLink title={copy.retry} onPress={pullToRefresh} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ paddingHorizontal: layout.margin }}>
          <T style="body" color="ink2">
            {copy.emptyBody}
          </T>
          <Gap size="s32" />
          <Pill title={copy.emptyAction} onPress={openAdd} />
        </View>
      ) : (
        <LedgerList
          onRefresh={pullToRefresh}
          items={items.map((item) => ({
            id: item.subscription.id,
            date: formatLedgerDate(item.nextRenewal),
            name: item.subscription.name,
            amount: formatMoney(
              item.subscription.amountMinor,
              item.subscription.currency,
            ),
            note: rowNote(item),
            noteTone: item.status === "trial" ? "accent" : "ink3",
            onPress: () => openDetail(item.subscription.id),
          }))}
        />
      )}
      {alert}
    </Screen>
  );
}
