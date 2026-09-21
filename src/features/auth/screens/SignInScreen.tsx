import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";

import {
  Field,
  Gap,
  Pill,
  Spacer,
  T,
  Tappable,
  TextLink,
  layout,
} from "@/design";

import { resendCode, signIn } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import { useAuthAlert } from "../useAuthAlert";
import { isValidEmail, normalizeEmail } from "../validation";
import { AuthShell } from "./AuthShell";

export function SignInScreen() {
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const { alert, show, showFailure } = useAuthAlert();

  const normalizedEmail = normalizeEmail(email);
  const canSubmit =
    !submitting && isValidEmail(normalizedEmail) && password.length > 0;

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
    const result = await signIn(normalizedEmail, password);
    setSubmitting(false);

    if (result.ok) {
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

  return (
    <AuthShell title={authCopy.signIn.title} body={authCopy.signIn.body}>
      <Field
        label={authCopy.signIn.emailLabel}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          setPasswordError(undefined);
        }}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <Spacer height={layout.auth.fieldGap} />
      <Field
        ref={passwordInput}
        label={authCopy.signIn.passwordLabel}
        value={password}
        onChangeText={(next) => {
          setPassword(next);
          setPasswordError(undefined);
        }}
        error={passwordError}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        trailing={{
          title: revealed ? authCopy.signIn.hide : authCopy.signIn.show,
          onPress: () => setRevealed((current) => !current),
        }}
      />
      <Spacer height={layout.auth.forgotGap} />
      <Tappable
        onPress={() =>
          show({
            title: authCopy.forgotSoon.title,
            message: authCopy.forgotSoon.message,
            actions: [{ title: authCopy.errors.dismiss, role: "cancel" }],
          })
        }
        accessibilityRole="button"
        accessibilityLabel={authCopy.signIn.forgot}
        style={{
          alignSelf: "flex-end",
          minHeight: layout.hit,
          justifyContent: "flex-start",
        }}
      >
        <T style="filter" color="ink2">
          {authCopy.signIn.forgot}
        </T>
      </Tappable>
      <Spacer grow />
      <Gap size="s24" />
      <Pill
        title={authCopy.signIn.primary}
        onPress={submit}
        disabled={!canSubmit}
      />
      <Gap size="s8" />
      <TextLink
        title={authCopy.signIn.secondary}
        onPress={() =>
          router.replace({ pathname: "/auth", params: { mode: "signUp" } })
        }
      />
      {alert}
    </AuthShell>
  );
}
