"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage, hasAuthErrorCode, isRateLimited, retryAfterSeconds } from "@/lib/auth/errors";
import { resetPasswordPath } from "@/lib/auth/redirect";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { PasswordField } from "../../_components/password-field";
import { authCopy } from "../../_data";
import { signInCopy } from "../_data";
import {
  parseSignIn,
  validateSignInField,
  type SignInField,
  type SignInValues,
} from "../_lib/validation";

export interface SignInFormProps {
  next: string;
  values: SignInValues;
  onValuesChange: (values: SignInValues) => void;
  onNeedsVerification: (email: string) => void;
}

type FormAlert = { readonly kind: "badCredentials" } | { readonly kind: "error"; readonly message: string };

function ResetLink({ email, children }: { email: string; children: ReactNode }) {
  return (
    <Link
      href={resetPasswordPath(email)}
      className="font-semibold text-inherit underline underline-offset-3 hover:text-inherit"
    >
      {children}
    </Link>
  );
}

export function SignInForm({ next, values, onValuesChange, onNeedsVerification }: SignInFormProps) {
  const router = useRouter();
  const [touched, setTouched] = useState<Partial<Record<SignInField, true>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<FormAlert | null>(null);
  const lockout = useCooldown(0, false);
  const copy = signInCopy;

  const errorFor = (field: SignInField): string | undefined =>
    submitted || touched[field] ? validateSignInField(field, values[field]) : undefined;

  const feedback = (field: SignInField) => {
    const message = errorFor(field);
    return message ? ({ tone: "error", message } as const) : undefined;
  };

  const update = (field: SignInField) => (value: string) => {
    onValuesChange({ ...values, [field]: value });
    setAlert(null);
  };

  const blur = (field: SignInField) => () => setTouched((t) => ({ ...t, [field]: true }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || lockout.active) return;
    setSubmitted(true);
    const input = parseSignIn(values);
    if (!input) return;

    setLoading(true);
    setAlert(null);
    let retryAfter: number | undefined;
    const { error } = await authClient.signIn.email(
      { email: input.email, password: input.password, rememberMe: remember, callbackURL: next },
      {
        onError: ({ response }) => {
          if (response.status === 429) retryAfter = retryAfterSeconds(response);
        },
      },
    );

    if (!error) {
      router.replace(next);
      router.refresh();
      return;
    }
    setLoading(false);
    if (isRateLimited(error)) {
      lockout.restart(retryAfter);
      return;
    }
    if (hasAuthErrorCode(error, "EMAIL_NOT_VERIFIED")) {
      onNeedsVerification(input.email);
      return;
    }
    if (hasAuthErrorCode(error, "INVALID_EMAIL_OR_PASSWORD")) {
      setAlert({ kind: "badCredentials" });
      return;
    }
    setAlert({ kind: "error", message: authErrorMessage(error) });
  };

  const credentialsRejected = alert?.kind === "badCredentials" && !lockout.active;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {lockout.active && (
        <InlineAlert tint="amber" icon="clock">
          <span className="font-semibold">{copy.locked.title}</span> {copy.locked.body(lockout.remaining)}{" "}
          <ResetLink email={values.email}>{copy.locked.action}</ResetLink>.
        </InlineAlert>
      )}
      {credentialsRejected && (
        <InlineAlert>
          <span className="font-semibold">{copy.badCredentials.title}</span> {copy.badCredentials.body}{" "}
          <ResetLink email={values.email}>{copy.badCredentials.action}</ResetLink>.
        </InlineAlert>
      )}
      {alert?.kind === "error" && <InlineAlert>{alert.message}</InlineAlert>}
      <TextField
        label={authCopy.email.label}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={authCopy.email.placeholder}
        value={values.email}
        onChange={(e) => update("email")(e.target.value)}
        onBlur={blur("email")}
        feedback={feedback("email")}
      />
      <PasswordField
        name="password"
        autoComplete="current-password"
        placeholder={copy.fields.password.placeholder}
        value={values.password}
        onValueChange={update("password")}
        onBlur={blur("password")}
        feedback={feedback("password")}
        labelAccessory={
          <Link
            href={resetPasswordPath(values.email)}
            className="text-footnote font-semibold text-brand no-underline hover:text-brand-hover"
          >
            {copy.fields.password.forgot}
          </Link>
        }
      />
      <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} className="text-small text-text-2">
        {copy.remember}
      </Checkbox>
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={loading}
        disabled={lockout.active}
        className="mt-1 font-semibold"
      >
        {copy.submit}
      </Button>
    </form>
  );
}
