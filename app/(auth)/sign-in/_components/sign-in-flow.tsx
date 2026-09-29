"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepSwap } from "@/components/motion/rise";
import { withNext } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { AuthHeader } from "../../_components/auth-header";
import { GoogleButton } from "../../_components/google-button";
import { VerifyStep } from "../../_components/verify-step";
import { authCopy } from "../../_data";
import { signInCopy } from "../_data";
import { emptySignInValues, type SignInValues } from "../_lib/validation";
import { SignInForm } from "./sign-in-form";

export interface SignInFlowProps {
  next: string;
}

type Step = { readonly step: "form" } | { readonly step: "verify"; readonly email: string };

function headerFor(state: Step) {
  switch (state.step) {
    case "form":
      return signInCopy.form;
    case "verify":
      return { title: authCopy.verify.title, subtitle: authCopy.verify.subtitle(state.email) };
  }
}

export function SignInFlow({ next }: SignInFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<Step>({ step: "form" });
  const [values, setValues] = useState<SignInValues>(emptySignInValues);
  const header = headerFor(state);

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  return (
    <>
      <AuthHeader title={header.title} subtitle={header.subtitle} stepKey={state.step} />

      <StepSwap stepKey={state.step} className="grid gap-7">
        {state.step === "form" && (
          <div className="grid gap-5">
            <GoogleButton callbackURL={next} errorCallbackURL={routes.signIn} />
            <div className="flex items-center gap-3 text-footnote text-muted">
              <span aria-hidden className="h-px flex-1 bg-line" />
              {authCopy.divider}
              <span aria-hidden className="h-px flex-1 bg-line" />
            </div>
            <SignInForm
              next={next}
              values={values}
              onValuesChange={setValues}
              onNeedsVerification={(email) => setState({ step: "verify", email })}
            />
          </div>
        )}

        {state.step === "verify" && (
          <VerifyStep
            key={state.email}
            email={state.email}
            onVerified={finish}
            onBack={() => {
              setValues((current) => ({ ...current, password: "" }));
              setState({ step: "form" });
            }}
            backLabel={signInCopy.verifyBack}
          />
        )}

        {state.step === "form" && (
          <p className="m-0 text-center text-small text-text-2">
            {signInCopy.switchPrompt}{" "}
            <Link href={withNext(routes.signUp, next)} className="font-semibold">
              {signInCopy.switchCta}
            </Link>
          </p>
        )}
      </StepSwap>
    </>
  );
}
