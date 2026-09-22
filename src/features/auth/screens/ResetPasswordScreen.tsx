import { router } from "expo-router";
import { useState } from "react";

import { Input, T } from "@/design";

import { confirmPasswordReset, requestPasswordReset } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import { useAuthAlert } from "../useAuthAlert";
import { useResendCountdown } from "../useResendCountdown";
import {
  isValidCode,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "../validation";
import { AuthStep } from "./AuthStep";
import { CodeStep } from "./CodeStep";

const copy = authCopy.reset;
const step = authCopy.step;

export type ResetPasswordScreenProps = {
  initialEmail: string | null;
};

type Stage = "email" | "password" | "code";

export function ResetPasswordScreen({ initialEmail }: ResetPasswordScreenProps) {
  const [stage, setStage] = useState<Stage>(
    initialEmail === null ? "email" : "password",
  );
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const countdown = useResendCountdown();
  const { alert, showFailure } = useAuthAlert();

  const normalizedEmail = normalizeEmail(email);
  const emailValid = isValidEmail(normalizedEmail);
  const canSend = !submitting && emailValid && isValidPassword(password);

  const sendCode = async () => {
    if (!canSend) {
      return;
    }
    setSubmitting(true);
    const result = await requestPasswordReset(normalizedEmail);
    setSubmitting(false);

    if (result.ok || result.reason === "rateLimited") {
      setCode("");
      setCodeError(undefined);
      countdown.restart();
      setStage("code");
      return;
    }
    if (result.reason === "invalid") {
      setEmailError(failureMessage(result.reason));
      setStage("email");
      return;
    }
    showFailure(result.reason);
  };

  const resend = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    const result = await requestPasswordReset(normalizedEmail);
    setSubmitting(false);

    if (result.ok) {
      setCode("");
      setCodeError(undefined);
      countdown.restart();
      return;
    }
    if (result.reason === "rateLimited") {
      setCodeError(failureMessage(result.reason));
      return;
    }
    showFailure(result.reason);
  };

  const confirm = async (value: string) => {
    if (submitting || !isValidCode(value)) {
      return;
    }
    setSubmitting(true);
    const result = await confirmPasswordReset(normalizedEmail, value, password);
    setSubmitting(false);

    if (result.ok) {
      return;
    }
    setCode("");
    if (result.reason === "invalidCode" || result.reason === "rateLimited") {
      setCodeError(failureMessage(result.reason));
      return;
    }
    showFailure(result.reason);
  };

  if (stage === "code") {
    return (
      <CodeStep
        title={copy.codeTitle}
        subtitle={
          <>
            {copy.codeBodyLead}
            <T style="caption" color="ink">
              {normalizedEmail}
            </T>
            {copy.codeBodyTail}
          </>
        }
        code={code}
        onChangeCode={(next) => {
          setCode(next);
          setCodeError(undefined);
        }}
        onSubmit={confirm}
        submitting={submitting}
        error={codeError}
        remaining={countdown.remaining}
        onResend={resend}
        resending={submitting}
        primaryTitle={copy.codePrimary}
        secondaryTitle={copy.codeSecondary}
        onSecondary={() => {
          setCode("");
          setCodeError(undefined);
          setStage("password");
        }}
        onBack={() => {
          setCode("");
          setCodeError(undefined);
          setStage("password");
        }}
      >
        {alert}
      </CodeStep>
    );
  }

  if (stage === "password") {
    return (
      <AuthStep
        title={copy.passwordTitle}
        subtitle={copy.passwordHint}
        onBack={() => setStage("email")}
        primary={{
          title: copy.sendCode,
          onPress: sendCode,
          disabled: !canSend,
          loading: submitting,
        }}
        secondary={{ title: copy.backToSignIn, onPress: () => router.back() }}
      >
        <Input
          label={copy.passwordLabel}
          value={password}
          onChangeText={setPassword}
          autoFocus
          secureTextEntry={!revealed}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          passwordRules="minlength: 8; required: digit;"
          returnKeyType="go"
          onSubmitEditing={sendCode}
          suffix={{
            title: revealed ? step.hide : step.show,
            onPress: () => setRevealed((current) => !current),
          }}
        />
        {alert}
      </AuthStep>
    );
  }

  return (
    <AuthStep
      title={copy.emailTitle}
      subtitle={copy.emailSubtitle}
      onClose={() => router.back()}
      primary={{
        title: step.continue,
        onPress: () => setStage("password"),
        disabled: !emailValid,
      }}
      secondary={{ title: copy.backToSignIn, onPress: () => router.back() }}
    >
      <Input
        label={step.emailLabel}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          setEmailError(undefined);
        }}
        error={emailError}
        placeholder={step.emailPlaceholder}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => {
          if (emailValid) {
            setStage("password");
          }
        }}
      />
      {alert}
    </AuthStep>
  );
}
