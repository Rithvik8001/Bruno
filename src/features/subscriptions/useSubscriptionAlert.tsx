import { useNativeAlert, type NativeAlertConfig } from "@/design";
import type { DataFailure } from "@/lib/supabase";

import { subscriptionsCopy } from "./copy";
import { failureMessage } from "./errors";

export type SubscriptionAlertConfig = NativeAlertConfig;

export function useSubscriptionAlert() {
  const { alert, show } = useNativeAlert();

  const showFailure = (reason: DataFailure) => {
    show({
      title: subscriptionsCopy.errors.alertTitle,
      message: failureMessage(reason),
      actions: [{ title: subscriptionsCopy.errors.dismiss, role: "cancel" }],
    });
  };

  return { alert, show, showFailure };
}
