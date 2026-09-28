"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { routes } from "@/lib/auth/rules";
import { emailSchema, firstIssue } from "../../_lib/fields";
import { authCopy } from "../../_data";
import { resetCopy } from "../_data";

export interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onCodeSent: (email: string) => void;
}

const resetEmailSchema = emailSchema(resetCopy.email.required);

export function EmailStep({ email, onEmailChange, onCodeSent }: EmailStepProps) {
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const copy = resetCopy.email;

  const error = submitted || touched ? firstIssue(resetEmailSchema, email) : undefined;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setSubmitted(true);
    const parsed = resetEmailSchema.safeParse(email);
    if (!parsed.success) return;

    setLoading(true);
    setFormError(null);
    const { error: requestError } = await authClient.emailOtp.requestPasswordReset({ email: parsed.data });
    setLoading(false);
    if (requestError) {
      setFormError(authErrorMessage(requestError));
      return;
    }
    onCodeSent(parsed.data);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid animate-rise gap-4">
      <TextField
        label={authCopy.email.label}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        placeholder={authCopy.email.placeholder}
        value={email}
        onChange={(e) => {
          onEmailChange(e.target.value);
          setFormError(null);
        }}
        onBlur={() => setTouched(true)}
        feedback={error ? { tone: "error", message: error } : undefined}
      />
      {formError && <InlineAlert>{formError}</InlineAlert>}
      <Button type="submit" size="lg" fullWidth loading={loading} className="font-semibold">
        {copy.submit}
      </Button>
      <p className="m-0 text-center text-small text-text-2">
        {copy.remembered}{" "}
        <Link href={routes.signIn} className="font-semibold">
          {copy.backToSignIn}
        </Link>
      </p>
    </form>
  );
}
