"use client";

import { useState } from "react";
import { GoogleMark } from "@/components/brand/google-mark";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage, isAuthErrorCode } from "@/lib/auth/errors";
import { authCopy } from "../_data";

export interface GoogleButtonProps {
  callbackURL: string;
  errorCallbackURL: string;
}

type GoogleState = { readonly status: "idle" | "redirecting" } | { readonly status: "failed"; readonly message: string };

export function GoogleButton({ callbackURL, errorCallbackURL }: GoogleButtonProps) {
  const [state, setState] = useState<GoogleState>({ status: "idle" });
  const copy = authCopy.google;

  const start = async () => {
    setState({ status: "redirecting" });
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
      newUserCallbackURL: callbackURL,
      errorCallbackURL,
    });
    if (error) {
      setState({
        status: "failed",
        message: isAuthErrorCode(error.code) ? authErrorMessage(error) : copy.failedBody,
      });
    }
  };

  return (
    <div className="grid gap-2.5">
      <Button variant="secondary" size="lg" fullWidth loading={state.status === "redirecting"} onClick={start}>
        <GoogleMark />
        {copy.label}
      </Button>
      {state.status === "failed" && (
        <InlineAlert>
          <span className="font-semibold">{copy.failedTitle}</span> {state.message}{" "}
          <button
            type="button"
            onClick={start}
            className="cursor-pointer bg-transparent p-0 font-semibold text-inherit underline underline-offset-3"
          >
            {copy.retry}
          </button>
        </InlineAlert>
      )}
    </div>
  );
}
