import { useState } from "react";

import { NativeAlert, type NativeAlertAction } from "@/design";
import type { DataFailure } from "@/lib/supabase";

import { subscriptionsCopy } from "./copy";
import { failureMessage } from "./errors";

export type SubscriptionAlertConfig = {
  title: string;
  message?: string;
  actions: readonly NativeAlertAction[];
};

const emptyConfig: SubscriptionAlertConfig = {
  title: "",
  actions: [{ title: subscriptionsCopy.errors.dismiss }],
};

export function useSubscriptionAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<SubscriptionAlertConfig>(emptyConfig);

  const show = (next: SubscriptionAlertConfig) => {
    setConfig(next);
    setVisible(true);
  };

  const showFailure = (reason: DataFailure) => {
    show({
      title: subscriptionsCopy.errors.alertTitle,
      message: failureMessage(reason),
      actions: [{ title: subscriptionsCopy.errors.dismiss, role: "cancel" }],
    });
  };

  const alert = (
    <NativeAlert
      visible={visible}
      title={config.title}
      message={config.message}
      actions={config.actions}
      onDismiss={() => setVisible(false)}
    />
  );

  return { alert, show, showFailure };
}
