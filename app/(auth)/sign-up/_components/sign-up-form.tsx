"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage, type AuthClientError } from "@/lib/auth/errors";
import { signUpCopy } from "../_data";
import { useUsernameAvailability } from "../_lib/use-username-availability";
import {
  validateField,
  validateSignUp,
  type SignUpErrors,
  type SignUpField,
  type SignUpInput,
  type SignUpValues,
} from "../_lib/validation";
import { PasswordField } from "./password-field";
import { UsernameField } from "./username-field";

export interface SignUpFormProps {
  values: SignUpValues;
  onValuesChange: (values: SignUpValues) => void;
  onSignedUp: (input: SignUpInput) => void;
}

const FIELD_FOR_CODE: Readonly<Partial<Record<string, SignUpField>>> = {
  USERNAME_IS_ALREADY_TAKEN: "username",
  USERNAME_TOO_SHORT: "username",
  USERNAME_TOO_LONG: "username",
  INVALID_USERNAME: "username",
  INVALID_EMAIL: "email",
  PASSWORD_TOO_SHORT: "password",
  PASSWORD_TOO_LONG: "password",
};

function routeServerError(error: AuthClientError): { field: SignUpField; message: string } | { form: string } {
  const field = error.code ? FIELD_FOR_CODE[error.code] : undefined;
  const message = authErrorMessage(error);
  return field ? { field, message } : { form: message };
}

export function SignUpForm({ values, onValuesChange, onSignedUp }: SignUpFormProps) {
  const [touched, setTouched] = useState<Partial<Record<SignUpField, true>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const availability = useUsernameAvailability(values.username);

  const errorFor = (field: SignUpField): string | undefined =>
    serverErrors[field] ?? (submitted || touched[field] ? validateField(field, values[field]) : undefined);

  const update = (field: SignUpField) => (value: string) => {
    onValuesChange({ ...values, [field]: value });
    setServerErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const blur = (field: SignUpField) => () => setTouched((t) => ({ ...t, [field]: true }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setSubmitted(true);
    const result = validateSignUp(values);
    if (!result.ok || availability.status === "taken") return;

    setLoading(true);
    setFormError(null);
    const { error } = await authClient.signUp.email({
      name: result.data.name,
      email: result.data.email,
      password: result.data.password,
      username: result.data.username,
    });
    setLoading(false);

    if (!error) {
      onSignedUp(result.data);
      return;
    }
    const routed = routeServerError(error);
    if ("field" in routed) setServerErrors({ [routed.field]: routed.message });
    else setFormError(routed.form);
  };

  const feedback = (field: SignUpField) => {
    const message = errorFor(field);
    return message ? ({ tone: "error", message } as const) : undefined;
  };

  const { fields } = signUpCopy;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <TextField
        label={fields.name.label}
        name="name"
        autoComplete="name"
        placeholder={fields.name.placeholder}
        value={values.name}
        onChange={(e) => update("name")(e.target.value)}
        onBlur={blur("name")}
        feedback={feedback("name")}
      />
      <UsernameField
        name="username"
        autoComplete="username"
        value={values.username}
        onValueChange={update("username")}
        onBlur={blur("username")}
        error={errorFor("username")}
        availability={availability}
      />
      <TextField
        label={fields.email.label}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={fields.email.placeholder}
        value={values.email}
        onChange={(e) => update("email")(e.target.value)}
        onBlur={blur("email")}
        feedback={feedback("email")}
      />
      <PasswordField
        name="password"
        autoComplete="new-password"
        value={values.password}
        onValueChange={update("password")}
        onBlur={blur("password")}
        feedback={feedback("password")}
      />
      {formError && <InlineAlert>{formError}</InlineAlert>}
      <Button type="submit" size="lg" fullWidth loading={loading} className="mt-1 font-semibold">
        {signUpCopy.submit}
      </Button>
      <p className="m-0 text-center text-footnote text-pretty text-muted">
        {signUpCopy.legal.prefix}{" "}
        <Link href="#" className="text-text-2">
          {signUpCopy.legal.terms}
        </Link>{" "}
        {signUpCopy.legal.and}{" "}
        <Link href="#" className="text-text-2">
          {signUpCopy.legal.privacy}
        </Link>
        .
      </p>
    </form>
  );
}
