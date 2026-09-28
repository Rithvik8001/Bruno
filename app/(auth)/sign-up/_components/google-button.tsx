"use client";

import { useState } from "react";
import { GoogleMark } from "@/components/brand/google-mark";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage, isAuthErrorCode } from "@/lib/auth/errors";
import { routes } from "@/lib/auth/rules";
import { signUpCopy } from "../_data";

type GoogleState = { readonly status: "idle" | "redirecting" } | { readonly status: "failed"; readonly message: string };

export function GoogleButton() {
  const [state, setState] = useState<GoogleState>({ status: "idle" });

  const start = async () => {
    setState({ status: "redirecting" });
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: routes.app,
      newUserCallbackURL: routes.app,
      errorCallbackURL: routes.signUp,
    });
    if (error) {
      setState({
        status: "failed",
        message: isAuthErrorCode(error.code) ? authErrorMessage(error) : signUpCopy.google.failedBody,
      });
    }
  };

  return (
    <div className="grid gap-2.5">
      <Button variant="secondary" size="lg" fullWidth loading={state.status === "redirecting"} onClick={start}>
        <GoogleMark />
        {signUpCopy.google.label}
      </Button>
      {state.status === "failed" && (
        <InlineAlert>
          <span className="font-semibold">{signUpCopy.google.failedTitle}</span> {state.message}{" "}
          <button
            type="button"
            onClick={start}
            className="cursor-pointer bg-transparent p-0 font-semibold text-inherit underline underline-offset-3"
          >
            {signUpCopy.google.retry}
          </button>
        </InlineAlert>
      )}
    </div>
  );
}
