"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { OtpInput } from "@/components/ui/otp-input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { authRules } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { signUpCopy } from "../_data";
import { useCooldown } from "../_lib/use-cooldown";

export interface VerifyStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

type VerifyState =
  | { readonly status: "entering" }
  | { readonly status: "verifying" }
  | { readonly status: "failed"; readonly message: string };

export function VerifyStep({ email, onVerified, onBack }: VerifyStepProps) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<VerifyState>({ status: "entering" });
  const [resending, setResending] = useState(false);
  const cooldown = useCooldown(authRules.otp.resendCooldownSeconds);
  const { toast } = useToast();
  const copy = signUpCopy.code;

  const verify = async (otp: string) => {
    setState({ status: "verifying" });
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      setCode("");
      return;
    }
    onVerified();
  };

  const resend = async () => {
    if (cooldown.active || resending) return;
    setResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    setResending(false);
    if (error) {
      setState({ status: "failed", message: authErrorMessage(error) });
      return;
    }
    cooldown.restart();
    setState({ status: "entering" });
    setCode("");
    toast({ message: copy.resent, icon: "check", tint: "green" });
  };

  const resendDisabled = cooldown.active || resending;

  return (
    <div className="grid animate-rise gap-6">
      <OtpInput
        value={code}
        onChange={(next) => {
          setCode(next);
          if (state.status === "failed") setState({ status: "entering" });
        }}
        onComplete={verify}
        length={authRules.otp.length}
        invalid={state.status === "failed"}
        disabled={state.status === "verifying"}
        autoFocus
      />
      {state.status === "failed" && (
        <div
          role="alert"
          data-tint="red"
          className="flex animate-rise items-center justify-center gap-1.5 text-footnote font-medium text-tint"
        >
          <Icon name="alert" size={14} strokeWidth={2.2} />
          {state.message}
        </div>
      )}
      {state.status === "verifying" && (
        <div className="flex items-center justify-center gap-2 text-footnote text-text-2">
          <Spinner className="size-3.5" label={copy.checking} />
          {copy.checking}
        </div>
      )}
      <div className="grid justify-items-center gap-2 text-small text-text-2">
        <span>
          {copy.didntGetIt}{" "}
          <button
            type="button"
            onClick={resend}
            disabled={resendDisabled}
            className={cn(
              "bg-transparent p-0 font-semibold",
              resendDisabled ? "cursor-default text-muted" : "cursor-pointer text-brand",
            )}
          >
            {cooldown.active ? copy.resendIn(cooldown.remaining) : copy.resend}
          </button>
        </span>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer bg-transparent p-0 text-footnote text-muted transition-colors hover:text-text"
        >
          {copy.back}
        </button>
      </div>
    </div>
  );
}
