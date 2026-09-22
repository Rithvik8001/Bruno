import { router } from "expo-router";
import { useState } from "react";

import { Input, T } from "@/design";

import { resendCode, signIn, signUp } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import type { AuthMode } from "../types";
import { useAuthAlert } from "../useAuthAlert";
import { isValidEmail, isValidPassword, normalizeEmail } from "../validation";
import { AuthStep } from "./AuthStep";

const copy = authCopy.step;

export type AuthScreenProps = {
  mode: AuthMode;
};

type Stage = "email" | "password";

export function AuthScreen({ mode }: AuthScreenProps) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const { alert, show, showFailure } = useAuthAlert();

  const signingUp = mode === "signUp";
  const normalizedEmail = normalizeEmail(email);
  const emailValid = isValidEmail(normalizedEmail);
  const canSubmit =
    !submitting &&
    emailValid &&
    (signingUp ? isValidPassword(password) : password.length > 0);

  const switchMode = () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setPassword("");
    setStage("email");
    router.setParams({ mode: signingUp ? "signIn" : "signUp" });
  };

  const continueToPassword = () => {
    if (!emailValid) {
      return;
    }
    setEmailError(undefined);
    setStage("password");
  };

  const verifyNow = async (address: string) => {
    setSubmitting(true);
    const result = await resendCode(address);
    setSubmitting(false);

    if (result.ok || result.reason === "rateLimited") {
      router.push({ pathname: "/verify", params: { email: address } });
      return;
    }
    showFailure(result.reason);
  };

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setPasswordError(undefined);
    const result = signingUp
      ? await signUp(normalizedEmail, password)
      : await signIn(normalizedEmail, password);
    setSubmitting(false);

    if (result.ok) {
      if (signingUp) {
        router.push({ pathname: "/verify", params: { email: normalizedEmail } });
      }
      return;
    }
    if (result.reason === "invalid") {
      setEmailError(failureMessage(result.reason));
      setStage("email");
      return;
    }
    if (result.reason === "invalidCredentials") {
      setPasswordError(failureMessage(result.reason));
      return;
    }
    if (result.reason === "unverified") {
      show({
        title: authCopy.unverified.title,
        message: `${authCopy.unverified.messageLead}${normalizedEmail}${authCopy.unverified.messageTail}`,
        actions: [
          { title: authCopy.unverified.cancel, role: "cancel" },
          {
            title: authCopy.unverified.confirm,
            onPress: () => verifyNow(normalizedEmail),
          },
        ],
      });
      return;
    }
    showFailure(result.reason);
  };

  if (stage === "password") {
    return (
      <AuthStep
        title={signingUp ? copy.passwordCreateTitle : copy.passwordEnterTitle}
        subtitle={
          signingUp ? (
            copy.passwordHint
          ) : (
            <>
              {copy.passwordEnterLead}
              <T style="caption" color="ink">
                {normalizedEmail}
              </T>
              {copy.passwordEnterTail}
            </>
          )
        }
        onBack={() => setStage("email")}
        primary={{
          title: signingUp ? copy.createAccount : copy.signIn,
          onPress: submit,
          disabled: !canSubmit,
          loading: submitting,
        }}
        secondary={
          signingUp
            ? undefined
            : {
                title: copy.forgot,
                onPress: () =>
                  router.push({
                    pathname: "/reset",
                    params: { email: normalizedEmail },
                  }),
              }
        }
      >
        <Input
          label={copy.passwordLabel}
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            setPasswordError(undefined);
          }}
          error={passwordError}
          autoFocus
          secureTextEntry={!revealed}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={signingUp ? "new-password" : "current-password"}
          textContentType={signingUp ? "newPassword" : "password"}
          passwordRules={signingUp ? "minlength: 8; required: digit;" : undefined}
          returnKeyType="go"
          onSubmitEditing={submit}
          suffix={{
            title: revealed ? copy.hide : copy.show,
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
      subtitle={signingUp ? copy.emailSubtitleSignUp : copy.emailSubtitleSignIn}
      onClose={() => router.back()}
      primary={{
        title: copy.continue,
        onPress: continueToPassword,
        disabled: !emailValid,
      }}
      secondary={{
        title: signingUp ? copy.haveAccount : copy.newHere,
        onPress: switchMode,
      }}
    >
      <Input
        label={copy.emailLabel}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          setEmailError(undefined);
        }}
        error={emailError}
        placeholder={copy.emailPlaceholder}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={continueToPassword}
      />
      {alert}
    </AuthStep>
  );
}
