"use client";

import Link from "next/link";
import { useState } from "react";
import { withNext } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { AuthHeader } from "../../_components/auth-header";
import { GoogleButton } from "../../_components/google-button";
import { VerifyStep } from "../../_components/verify-step";
import { authCopy } from "../../_data";
import { signUpCopy } from "../_data";
import { emptySignUpValues, type SignUpValues } from "../_lib/validation";
import { DoneStep } from "./done-step";
import { SignUpForm } from "./sign-up-form";

type Step =
  | { readonly step: "form" }
  | { readonly step: "verify"; readonly email: string; readonly name: string }
  | { readonly step: "done"; readonly name: string };

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function headerFor(state: Step) {
  switch (state.step) {
    case "form":
      return signUpCopy.form;
    case "verify":
      return { title: authCopy.verify.title, subtitle: authCopy.verify.subtitle(state.email) };
    case "done":
      return { title: signUpCopy.done.title(firstName(state.name)), subtitle: signUpCopy.done.subtitle };
  }
}

export function SignUpFlow({ next }: { next: string }) {
  const [state, setState] = useState<Step>({ step: "form" });
  const [values, setValues] = useState<SignUpValues>(emptySignUpValues);
  const header = headerFor(state);

  return (
    <>
      <AuthHeader title={header.title} subtitle={header.subtitle} />

      {state.step === "form" && (
        <div className="grid gap-5">
          <GoogleButton callbackURL={next} errorCallbackURL={routes.signUp} />
          <div className="flex items-center gap-3 text-footnote text-muted">
            <span aria-hidden className="h-px flex-1 bg-line" />
            {authCopy.divider}
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <SignUpForm
            values={values}
            onValuesChange={setValues}
            onSignedUp={({ email, name }) => setState({ step: "verify", email, name })}
          />
        </div>
      )}

      {state.step === "verify" && (
        <VerifyStep
          key={state.email}
          email={state.email}
          onVerified={() => setState({ step: "done", name: state.name })}
          onBack={() => setState({ step: "form" })}
        />
      )}

      {state.step === "done" && <DoneStep href={next} />}

      {state.step === "form" && (
        <p className="m-0 text-center text-small text-text-2">
          {signUpCopy.switchPrompt}{" "}
          <Link href={withNext(routes.signIn, next)} className="font-semibold">
            {signUpCopy.switchCta}
          </Link>
        </p>
      )}
    </>
  );
}
