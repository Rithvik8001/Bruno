import { useState } from "react";

import { NativeAlert, type NativeAlertAction } from "@/design";

import type { AuthFailure } from "./api";
import { authCopy } from "./copy";
import { failureMessage } from "./errors";

export type AuthAlertConfig = {
  title: string;
  message?: string;
  actions: readonly NativeAlertAction[];
};

const emptyConfig: AuthAlertConfig = {
  title: "",
  actions: [{ title: authCopy.errors.dismiss }],
};

export function useAuthAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AuthAlertConfig>(emptyConfig);

  const show = (next: AuthAlertConfig) => {
    setConfig(next);
    setVisible(true);
  };

  const showFailure = (reason: AuthFailure) => {
    show({
      title: authCopy.errors.alertTitle,
      message: failureMessage(reason),
      actions: [{ title: authCopy.errors.dismiss, role: "cancel" }],
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
