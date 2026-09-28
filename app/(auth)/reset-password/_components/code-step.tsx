"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { InlineAlert } from "@/components/ui/inline-alert";
import { OtpInput } from "@/components/ui/otp-input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { authRules } from "@/lib/auth/rules";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { cn } from "@/lib/utils/cn";
import { authCopy } from "../../_data";
import { resetCopy } from "../_data";

export interface CodeStepProps {
  email: string;
  initialError?: string;
  onVerified: (otp: string) => void;
  onChangeEmail: () => void;
}

type CodeState =
  | { readonly status: "entering" }
  | { readonly status: "verifying" }
  | { readonly status: "failed"; readonly message: string; readonly attempt: number };

export function CodeStep({ email, initialError, onVerified, onChangeEmail }: CodeStepProps) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<CodeState>(
    initialError ? { status: "failed", message: initialError, attempt: 0 } : { status: "entering" },
  );
  const [resending, setResending] = useState(false);
  const cooldown = useCooldown(authRules.otp.resendCooldownSeconds);
  const { toast } = useToast();
  const copy = authCopy.code;

  const fail = (message: string) =>
    setState((current) => ({
      status: "failed",
      message,
      attempt: current.status === "failed" ? current.attempt + 1 : 1,
    }));

  const verify = async (otp: string) => {
    setState({ status: "verifying" });
    const { error } = await authClient.emailOtp.checkVerificationOtp({ email, otp, type: "forget-password" });
    if (error) {
      setCode("");
      fail(authErrorMessage(error));
      return;
    }
    onVerified(otp);
  };

  const resend = async () => {
    if (cooldown.active || resending) return;
    setResending(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email });
    setResending(false);
    if (error) {
      fail(authErrorMessage(error));
      return;
    }
    cooldown.restart();
    setCode("");
    setState({ status: "entering" });
    toast({ message: copy.resent, icon: "check", tint: "green" });
  };

  const resendDisabled = cooldown.active || resending;
  const shakeKey = state.status === "failed" ? state.attempt : 0;

  return (
    <div className="grid animate-rise gap-5">
      <div className="flex h-9 max-w-full items-center gap-2 justify-self-center rounded-control bg-surface pr-1 pl-1.5">
        <Avatar name={email} initials={email.charAt(0).toUpperCase()} tint="blue" size="sm" />
        <span className="truncate text-small font-medium">{email}</span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="h-7 shrink-0 cursor-pointer rounded-sm bg-transparent px-2.5 text-footnote font-semibold text-brand transition-colors hover:bg-brand-tint"
        >
          {resetCopy.code.change}
        </button>
      </div>

      <div key={shakeKey} className={cn(shakeKey > 0 && "animate-shake")}>
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
          label={copy.label}
          autoFocus
        />
      </div>

      {state.status === "failed" && <InlineAlert>{state.message}</InlineAlert>}

      <div className="grid min-h-11 justify-items-center gap-1 text-center text-small text-text-2">
        {state.status === "verifying" ? (
          <span className="flex items-center gap-2 font-medium text-brand">
            <Spinner className="size-3.5" label={copy.checking} />
            {copy.checking}
          </span>
        ) : (
          <>
            <span>
              {copy.noCode}{" "}
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
            <span className="text-footnote text-muted">{copy.expiry}</span>
          </>
        )}
      </div>
    </div>
  );
}
