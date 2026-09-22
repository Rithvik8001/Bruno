import { router } from "expo-router";
import { useRef, useState } from "react";
import type { TextInput } from "react-native";

import { Field, Gap, Pill, Spacer, TextLink, layout } from "@/design";

import { signUp } from "../api";
import { authCopy } from "../copy";
import { failureMessage } from "../errors";
import { useAuthAlert } from "../useAuthAlert";
import { isValidEmail, isValidPassword, normalizeEmail } from "../validation";
import { AuthShell } from "./AuthShell";

export function SignUpScreen() {
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const { alert, showFailure } = useAuthAlert();

  const normalizedEmail = normalizeEmail(email);
  const canSubmit =
    !submitting && isValidEmail(normalizedEmail) && isValidPassword(password);

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    const result = await signUp(normalizedEmail, password);
    setSubmitting(false);

    if (result.ok) {
      router.push({ pathname: "/verify", params: { email: normalizedEmail } });
      return;
    }
    if (result.reason === "invalid") {
      setEmailError(failureMessage(result.reason));
      return;
    }
    showFailure(result.reason);
  };

  return (
    <AuthShell title={authCopy.signUp.title} body={authCopy.signUp.body}>
      <Field
        label={authCopy.signUp.emailLabel}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          setEmailError(undefined);
        }}
        error={emailError}
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
      <Field
        ref={passwordInput}
        label={authCopy.signUp.passwordLabel}
        value={password}
        onChangeText={setPassword}
        hint={authCopy.signUp.passwordHint}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8; required: digit;"
        returnKeyType="go"
        onSubmitEditing={submit}
        trailing={{
          title: revealed ? authCopy.signUp.hide : authCopy.signUp.show,
          onPress: () => setRevealed((current) => !current),
        }}
      />
      <Spacer grow />
      <Gap size="s24" />
      <Pill
        title={authCopy.signUp.primary}
        onPress={submit}
        disabled={!canSubmit}
      />
      <Gap size="s8" />
      <TextLink
        title={authCopy.signUp.secondary}
        onPress={() =>
          router.replace({ pathname: "/auth", params: { mode: "signIn" } })
        }
      />
      {alert}
    </AuthShell>
  );
}
