import { useNativeAlert, type NativeAlertConfig } from "@/design";

import type { AuthFailure } from "./api";
import { authCopy } from "./copy";
import { failureMessage } from "./errors";

export type AuthAlertConfig = NativeAlertConfig;

export function useAuthAlert() {
  const { alert, show } = useNativeAlert();

  const showFailure = (reason: AuthFailure) => {
    show({
      title: authCopy.errors.alertTitle,
      message: failureMessage(reason),
      actions: [{ title: authCopy.errors.dismiss, role: "cancel" }],
    });
  };

  return { alert, show, showFailure };
}
