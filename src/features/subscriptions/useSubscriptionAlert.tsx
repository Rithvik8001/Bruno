import { useState } from "react";

import { NativeAlert } from "@/design";
import type { DataFailure } from "@/lib/supabase";

import { subscriptionsCopy } from "./copy";
import { failureMessage } from "./errors";

export function useSubscriptionAlert() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const showFailure = (reason: DataFailure) => {
    setMessage(failureMessage(reason));
    setVisible(true);
  };

  const alert = (
    <NativeAlert
      visible={visible}
      title={subscriptionsCopy.errors.alertTitle}
      message={message}
      actions={[{ title: subscriptionsCopy.errors.dismiss, role: "cancel" }]}
      onDismiss={() => setVisible(false)}
    />
  );

  return { alert, showFailure };
}
