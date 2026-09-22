import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";

import {
  CodeSlots,
  Field,
  Gap,
  Pill,
  Spacer,
  T,
  Tappable,
  TextLink,
  layout,
} from "@/design";

import { confirmPasswordReset, requestPasswordReset } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import { useAuthAlert } from "../useAuthAlert";
import { formatCountdown, useResendCountdown } from "../useResendCountdown";
import {
  isValidCode,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "../validation";
import { AuthShell } from "./AuthShell";

const copy = authCopy.reset;

export type ResetPasswordScreenProps = {
  initialEmail: string | null;
};

type Stage = "form" | "code";

export function ResetPasswordScreen({ initialEmail }: ResetPasswordScreenProps) {
  const passwordInput = useRef<TextInput>(null);
  const [stage, setStage] = useState<Stage>("form");
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
  const canSend =
    !submitting && isValidEmail(normalizedEmail) && isValidPassword(password);

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
      <AuthShell
        title={copy.codeTitle}
        body={
          <>
            {copy.codeBodyLead}
            <T style="body" color="ink">
              {normalizedEmail}
            </T>
            {copy.codeBodyTail}
          </>
        }
      >
        <CodeSlots
          value={code}
          onChangeValue={(next) => {
            setCode(next);
            setCodeError(undefined);
          }}
          onComplete={confirm}
          autoFocus
        />
        <Gap size="s16" />
        {codeError === undefined ? null : (
          <>
            <T style="caption" color="ink2">
              {codeError}
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
            disabled={submitting}
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
          title={copy.codePrimary}
          onPress={() => confirm(code)}
          disabled={submitting || !isValidCode(code)}
        />
        <Gap size="s8" />
        <TextLink
          title={copy.codeSecondary}
          onPress={() => {
            setCode("");
            setCodeError(undefined);
            setStage("form");
          }}
        />
        {alert}
      </AuthShell>
    );
  }

  return (
    <AuthShell title={copy.title} body={copy.body}>
      <Field
        label={copy.emailLabel}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          setEmailError(undefined);
        }}
        error={emailError}
        autoFocus={initialEmail === null}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <Field
        ref={passwordInput}
        label={copy.passwordLabel}
        value={password}
        onChangeText={setPassword}
        hint={copy.passwordHint}
        autoFocus={initialEmail !== null}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8; required: digit;"
        returnKeyType="go"
        onSubmitEditing={sendCode}
        trailing={{
          title: revealed ? copy.hide : copy.show,
          onPress: () => setRevealed((current) => !current),
        }}
      />
      <Spacer grow />
      <Gap size="s24" />
      <Pill title={copy.primary} onPress={sendCode} disabled={!canSend} />
      <Gap size="s8" />
      <TextLink title={copy.secondary} onPress={() => router.back()} />
      {alert}
    </AuthShell>
  );
}
