import { router } from "expo-router";
import { useState } from "react";

import { T } from "@/design";

import { resendCode, verifyCode } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import { useAuthAlert } from "../useAuthAlert";
import { useResendCountdown } from "../useResendCountdown";
import { isValidCode } from "../validation";
import { CodeStep } from "./CodeStep";

export type VerifyScreenProps = {
  email: string;
};

export function VerifyScreen({ email }: VerifyScreenProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const countdown = useResendCountdown();
  const { alert, showFailure } = useAuthAlert();

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
    showFailure(result.reason);
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
    showFailure(result.reason);
  };

  return (
    <CodeStep
      title={authCopy.verify.title}
      subtitle={
        <>
          {authCopy.verify.bodyLead}
          <T style="caption" color="ink">
            {email}
          </T>
          {authCopy.verify.bodyTail}
        </>
      }
      code={code}
      onChangeCode={(next) => {
        setCode(next);
        setError(undefined);
      }}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      remaining={countdown.remaining}
      onResend={resend}
      resending={resending}
      primaryTitle={authCopy.verify.primary}
      secondaryTitle={authCopy.verify.secondary}
      onSecondary={() => router.back()}
      onBack={() => router.back()}
    >
      {alert}
    </CodeStep>
  );
}
