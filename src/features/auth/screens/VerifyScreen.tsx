import { router } from "expo-router";
import { useState } from "react";

import {
  CodeSlots,
  Gap,
  NavRow,
  Pill,
  Screen,
  Spacer,
  T,
  Tappable,
  TextLink,
  layout,
} from "@/design";

import { resendCode, verifyCode } from "../api";
import { authCopy } from "../copy";
import { alertFailure, failureMessage } from "../errors";
import { formatCountdown, useResendCountdown } from "../useResendCountdown";
import { isValidCode } from "../validation";

export type VerifyScreenProps = {
  email: string;
};

export function VerifyScreen({ email }: VerifyScreenProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const countdown = useResendCountdown();

  const submit = async (value: string) => {
    if (submitting || !isValidCode(value)) {
      return;
    }
    setSubmitting(true);
    const result = await verifyCode(email, value);
    setSubmitting(false);

    if (result.ok) {
      return;
    }
    setCode("");
    if (result.reason === "invalidCode" || result.reason === "rateLimited") {
      setError(failureMessage(result.reason));
      return;
    }
    alertFailure(result.reason);
  };

  const resend = async () => {
    if (resending) {
      return;
    }
    setResending(true);
    const result = await resendCode(email);
    setResending(false);

    if (result.ok) {
      setError(undefined);
      setCode("");
      countdown.restart();
      return;
    }
    if (result.reason === "rateLimited") {
      setError(failureMessage(result.reason));
      return;
    }
    alertFailure(result.reason);
  };

  return (
    <Screen scroll fill keyboard scrollViewProps={{ alwaysBounceVertical: false }}>
      <NavRow onBack={() => router.back()} />
      <Spacer height={layout.auth.navGap} />
      <T style="title">{authCopy.verify.title}</T>
      <Gap size="s16" />
      <T style="body" color="ink2">
        {authCopy.verify.bodyLead}
        <T style="body" color="ink">
          {email}
        </T>
        {authCopy.verify.bodyTail}
      </T>
      <Gap size="s56" />
      <CodeSlots
        value={code}
        onChangeValue={(next) => {
          setCode(next);
          setError(undefined);
        }}
        onComplete={submit}
        autoFocus
      />
      <Gap size="s16" />
      {error === undefined ? null : (
        <>
          <T style="caption" color="ink2">
            {error}
          </T>
          <Gap size="s8" />
        </>
      )}
      {countdown.remaining > 0 ? (
        <T style="caption" color="ink3">
          {authCopy.verify.resendIn}
          {formatCountdown(countdown.remaining)}
        </T>
      ) : (
        <Tappable
          onPress={resend}
          disabled={resending}
          accessibilityRole="button"
          accessibilityLabel={authCopy.verify.resend}
          style={{
            minHeight: layout.hit,
            justifyContent: "center",
            alignSelf: "flex-start",
          }}
        >
          <T style="caption" color="ink2">
            {authCopy.verify.resend}
          </T>
        </Tappable>
      )}
      <Spacer grow />
      <Gap size="s24" />
      <Pill
        title={authCopy.verify.primary}
        onPress={() => submit(code)}
        disabled={submitting || !isValidCode(code)}
      />
      <Gap size="s8" />
      <TextLink
        title={authCopy.verify.secondary}
        onPress={() => router.back()}
      />
    </Screen>
  );
}
