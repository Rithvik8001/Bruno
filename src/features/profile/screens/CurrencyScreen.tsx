import { router, useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";

import { Gap, Screen, T, TextAction } from "@/design";
import { useAuthAlert } from "@/features/auth";
import { currencyName } from "@/lib/money";
import type { DataResult } from "@/lib/supabase";

import { profileCopy } from "../copy";
import { CurrencyList } from "../components/CurrencyList";
import { getDeviceCurrency } from "../deviceCurrency";
import { useProfile } from "../ProfileProvider";

const copy = profileCopy.currency;

export type CurrencyScreenProps = {
  subscriptionCount: number;
  refreshSubscriptions: () => Promise<DataResult<void>>;
};

export function CurrencyScreen({
  subscriptionCount,
  refreshSubscriptions,
}: CurrencyScreenProps) {
  const { profile, changeCurrency } = useProfile();
  const { alert, show, showFailure } = useAuthAlert();
  const [deviceCurrency] = useState(getDeviceCurrency);
  const [switching, setSwitching] = useState(false);
  const navigation = useNavigation();
  const current = profile?.currency ?? deviceCurrency;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TextAction title={copy.cancel} onPress={() => router.back()} />
      ),
    });
  }, [navigation]);

  const switchTo = async (code: string) => {
    setSwitching(true);
    const result = await changeCurrency(code);
    if (!result.ok) {
      setSwitching(false);
      showFailure(result.reason === "network" ? "network" : "unknown");
      return;
    }
    await refreshSubscriptions();
    setSwitching(false);
    router.back();
  };

  const ask = (code: string) => {
    if (code === current) {
      router.back();
      return;
    }
    show({
      title: copy.switchTitle(currencyName(code)),
      message: copy.switchMessage(subscriptionCount, code),
      actions: [
        { title: copy.switchCancel, role: "cancel" },
        {
          title: copy.switchConfirm,
          onPress: () => {
            void switchTo(code);
          },
        },
      ],
    });
  };

  return (
    <Screen header keyboard>
      <T style="title" accessibilityRole="header">
        {copy.title}
      </T>
      <Gap size="s24" />
      <CurrencyList
        selected={current}
        suggested={[current, deviceCurrency]}
        onSelect={ask}
        disabled={switching}
      />
      {alert}
    </Screen>
  );
}
